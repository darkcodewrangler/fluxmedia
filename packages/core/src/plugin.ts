import type { UploadOptions, UploadResult, UploadInput, TransformationOptions } from './types';

/**
 * Discriminator for which phase of the upload lifecycle an error occurred in.
 */
export type UploadPhase = 'beforeUpload' | 'upload' | 'afterUpload';

/**
 * Plugin lifecycle hooks.
 * Plugins can hook into various stages of the upload lifecycle.
 */
export interface PluginHooks {
  /**
   * Called before upload starts.
   * Can modify options or return early to cancel upload.
   */
  beforeUpload?: (
    file: UploadInput,
    options: UploadOptions
  ) => Promise<{ file: UploadInput; options: UploadOptions } | void>;

  /**
   * Called after successful upload.
   * Can modify or enrich the result.
   */
  afterUpload?: (result: UploadResult) => Promise<UploadResult>;

  /**
   * Called when an error occurs during the upload lifecycle.
   * The context includes a phase discriminator so handlers can determine
   * what failed and whether cleanup is needed.
   *
   * - phase 'upload': The provider upload failed; no object was stored.
   * - phase 'afterUpload': The upload succeeded but a post-upload hook failed;
   *   the uploaded object exists and may need to be rolled back.
   * - phase 'beforeUpload': A pre-upload hook failed; nothing was uploaded.
   */
  onError?: (
    error: Error,
    context: {
      file: UploadInput;
      options: UploadOptions;
      phase: UploadPhase;
      /** Present when phase === 'afterUpload' — the result from the successful upload. */
      uploadResult?: UploadResult;
    }
  ) => Promise<void>;

  /**
   * Called before delete operation.
   */
  beforeDelete?: (id: string) => Promise<string | void>;

  /**
   * Called after successful delete.
   */
  afterDelete?: (id: string) => Promise<void>;

  /**
   * Called before URL generation.
   * Can modify transformation options.
   */
  beforeGetUrl?: (
    id: string,
    transform?: TransformationOptions
  ) => Promise<{ id: string; transform?: TransformationOptions } | void>;
}

/**
 * Plugin definition.
 * Each plugin has a unique name and optional hooks.
 */
export interface FluxMediaPlugin {
  /**
   * Unique plugin name. Used for caching and override detection.
   * When multiple plugins have the same name, the last one takes precedence.
   */
  name: string;

  /**
   * Plugin version for debugging.
   */
  version?: string | undefined;

  /**
   * Plugin lifecycle hooks.
   */
  hooks: PluginHooks;

  /**
   * Plugin initialization. Called when plugin is registered.
   */
  init?: () => Promise<void> | void;

  /**
   * Plugin cleanup. Called when plugin is unregistered.
   */
  destroy?: () => Promise<void> | void;

  /**
   * When true, errors thrown by this plugin's hooks are caught and logged
   * rather than propagated. Use for analytics, logging, and metadata plugins.
   * Critical plugins (e.g. validation) should leave this false (the default).
   */
  optional?: boolean | undefined;
}

/**
 * Plugin manager with caching and duplicate override behavior.
 * Last registered plugin with the same name takes precedence.
 */
export class PluginManager {
  /**
   * Plugin cache by name.
   * Map preserves insertion order; we use array for execution order.
   */
  private pluginCache: Map<string, FluxMediaPlugin> = new Map();

  /**
   * Ordered list of plugins for execution.
   * Rebuilt when plugins change.
   */
  private orderedPlugins: FluxMediaPlugin[] = [];

  /**
   * Track if cache needs rebuild.
   */
  private cacheInvalid = false;

  /**
   * Register a plugin.
   * If a plugin with the same name exists, it will be overridden.
   *
   * @param plugin - Plugin to register
   * @returns Reference to this manager for chaining
   */
  async register(plugin: FluxMediaPlugin): Promise<this> {
    const existing = this.pluginCache.get(plugin.name);

    // Clean up existing plugin if being overridden
    if (existing?.destroy) {
      await existing.destroy();
    }

    // Register new plugin
    this.pluginCache.set(plugin.name, plugin);
    this.cacheInvalid = true;

    // Initialize the plugin
    if (plugin.init) {
      await plugin.init();
    }

    return this;
  }

  /**
   * Register multiple plugins at once.
   * Later plugins override earlier ones with the same name.
   *
   * @param plugins - Array of plugins to register
   */
  async registerAll(plugins: FluxMediaPlugin[]): Promise<this> {
    for (const plugin of plugins) {
      await this.register(plugin);
    }
    return this;
  }

  /**
   * Unregister a plugin by name.
   *
   * @param name - Plugin name to unregister
   */
  async unregister(name: string): Promise<boolean> {
    const plugin = this.pluginCache.get(name);
    if (!plugin) return false;

    if (plugin.destroy) {
      await plugin.destroy();
    }

    this.pluginCache.delete(name);
    this.cacheInvalid = true;
    return true;
  }

  /**
   * Check if a plugin is registered.
   */
  has(name: string): boolean {
    return this.pluginCache.has(name);
  }

  /**
   * Get a plugin by name.
   */
  get(name: string): FluxMediaPlugin | undefined {
    return this.pluginCache.get(name);
  }

  /**
   * Get all registered plugins in order.
   */
  getAll(): FluxMediaPlugin[] {
    this.rebuildCacheIfNeeded();
    return [...this.orderedPlugins];
  }

  /**
   * Get count of registered plugins.
   */
  get size(): number {
    return this.pluginCache.size;
  }

  /**
   * Clear all plugins.
   */
  async clear(): Promise<void> {
    for (const plugin of this.pluginCache.values()) {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    }
    this.pluginCache.clear();
    this.orderedPlugins = [];
    this.cacheInvalid = false;
  }

  /**
   * Run beforeUpload hooks for all plugins.
   */
  async runBeforeUpload(
    file: UploadInput,
    options: UploadOptions
  ): Promise<{ file: UploadInput; options: UploadOptions }> {
    this.rebuildCacheIfNeeded();

    let currentFile = file;
    let currentOptions = options;

    for (const plugin of this.orderedPlugins) {
      if (plugin.hooks.beforeUpload) {
        try {
          const result = await plugin.hooks.beforeUpload(currentFile, currentOptions);
          if (result) {
            currentFile = result.file;
            currentOptions = result.options;
          }
        } catch (err) {
          if (plugin.optional) {
            console.warn(
              `[FluxMedia] Optional plugin '${plugin.name}' failed in beforeUpload:`,
              err
            );
          } else {
            throw err;
          }
        }
      }
    }

    return { file: currentFile, options: currentOptions };
  }

  /**
   * Run afterUpload hooks for all plugins.
   */
  async runAfterUpload(result: UploadResult): Promise<UploadResult> {
    this.rebuildCacheIfNeeded();

    let currentResult = result;

    for (const plugin of this.orderedPlugins) {
      if (plugin.hooks.afterUpload) {
        try {
          currentResult = await plugin.hooks.afterUpload(currentResult);
        } catch (err) {
          if (plugin.optional) {
            console.warn(
              `[FluxMedia] Optional plugin '${plugin.name}' failed in afterUpload:`,
              err
            );
          } else {
            throw err;
          }
        }
      }
    }

    return currentResult;
  }

  /**
   * Run onError hooks for all plugins.
   */
  async runOnError(
    error: Error,
    context: {
      file: UploadInput;
      options: UploadOptions;
      phase: UploadPhase;
      uploadResult?: UploadResult;
    }
  ): Promise<void> {
    this.rebuildCacheIfNeeded();

    for (const plugin of this.orderedPlugins) {
      if (plugin.hooks.onError) {
        try {
          await plugin.hooks.onError(error, context);
        } catch (err) {
          if (plugin.optional) {
            console.warn(`[FluxMedia] Optional plugin '${plugin.name}' failed in onError:`, err);
          } else {
            throw err;
          }
        }
      }
    }
  }

  /**
   * Run beforeDelete hooks for all plugins.
   */
  async runBeforeDelete(id: string): Promise<string> {
    this.rebuildCacheIfNeeded();

    let currentId = id;

    for (const plugin of this.orderedPlugins) {
      if (plugin.hooks.beforeDelete) {
        try {
          const result = await plugin.hooks.beforeDelete(currentId);
          if (result) {
            currentId = result;
          }
        } catch (err) {
          if (plugin.optional) {
            console.warn(
              `[FluxMedia] Optional plugin '${plugin.name}' failed in beforeDelete:`,
              err
            );
          } else {
            throw err;
          }
        }
      }
    }

    return currentId;
  }

  /**
   * Run afterDelete hooks for all plugins.
   */
  async runAfterDelete(id: string): Promise<void> {
    this.rebuildCacheIfNeeded();

    for (const plugin of this.orderedPlugins) {
      if (plugin.hooks.afterDelete) {
        try {
          await plugin.hooks.afterDelete(id);
        } catch (err) {
          if (plugin.optional) {
            console.warn(
              `[FluxMedia] Optional plugin '${plugin.name}' failed in afterDelete:`,
              err
            );
          } else {
            throw err;
          }
        }
      }
    }
  }

  /**
   * Run beforeGetUrl hooks for all plugins.
   */
  async runBeforeGetUrl(
    id: string,
    transform?: TransformationOptions
  ): Promise<{ id: string; transform?: TransformationOptions | undefined }> {
    this.rebuildCacheIfNeeded();

    let currentId = id;
    let currentTransform = transform;

    for (const plugin of this.orderedPlugins) {
      if (plugin.hooks.beforeGetUrl) {
        try {
          const result = await plugin.hooks.beforeGetUrl(currentId, currentTransform);
          if (result) {
            currentId = result.id;
            currentTransform = result.transform;
          }
        } catch (err) {
          if (plugin.optional) {
            console.warn(
              `[FluxMedia] Optional plugin '${plugin.name}' failed in beforeGetUrl:`,
              err
            );
          } else {
            throw err;
          }
        }
      }
    }

    return { id: currentId, transform: currentTransform };
  }

  /**
   * Rebuild ordered plugin list from cache if needed.
   */
  private rebuildCacheIfNeeded(): void {
    if (!this.cacheInvalid) return;

    this.orderedPlugins = Array.from(this.pluginCache.values());
    this.cacheInvalid = false;
  }
}

/**
 * Create a simple plugin from hooks.
 * Utility function for quick plugin creation.
 */
export function createPlugin(
  name: string,
  hooks: PluginHooks,
  options?: { version?: string; optional?: boolean }
): FluxMediaPlugin {
  return {
    name,
    version: options?.version,
    hooks,
    optional: options?.optional,
  };
}

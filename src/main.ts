import {
  Plugin,
  MarkdownView,
  TFile,
  PluginSettingTab,
  App,
  Setting,
} from "obsidian";

interface PokemonStickerSettings {
  noteStickerSize: number;
}

const DEFAULT_SETTINGS: PokemonStickerSettings = {
  noteStickerSize: 50, // Default size
};

export default class PokemonStickerPlugin extends Plugin {
  settings!: PokemonStickerSettings;
  lastFrontMatter: Record<string, any> = {};
  updateTimeout: NodeJS.Timeout | null = null;

  async onload() {
    console.log("Pokémon Stickers Plugin Loaded!");

    // Load settings
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new PokemonStickerSettingTab(this.app, this));

    this.addCommand({
      id: "add-pokemon-sticker",
      name: "Add Pokémon Sticker",
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || !view.file) return;

        await this.assignPokemonToNote(view.file);
        this.scheduleUpdate();
      },
    });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.scheduleUpdate();
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("changed", () => {
        this.scheduleUpdate();
      })
    );

    setTimeout(() => this.updateFileExplorerStickers(), 500);
  }

  async assignPokemonToNote(file: TFile) {
    if (!file || !file.path.endsWith(".md")) return;

    const randomId = Math.floor(Math.random() * 1025) + 1;
    const randomPokemon = {
      name: `Pokémon #${randomId}`,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomId}.png`,
    };

    await this.app.fileManager.processFrontMatter(file, (frontMatter) => {
      frontMatter["pokemon"] = randomPokemon;
    });
  }

  /** Debounced update to avoid unnecessary re-renders */
  scheduleUpdate() {
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      this.displaySticker();
      this.updateFileExplorerStickers();
    }, 50);
  }

  displaySticker() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.file) return;

    const frontMatter = this.app.metadataCache.getFileCache(
      view.file
    )?.frontmatter;

    if (JSON.stringify(this.lastFrontMatter) === JSON.stringify(frontMatter)) {
      return;
    }
    this.lastFrontMatter = frontMatter || {};

    const titleEl = view.containerEl.querySelector(".inline-title");
    const fileExplorerItem = document.querySelector(
      `[data-path="${view.file.path}"] .nav-file-title-content`
    );

    if (!frontMatter || !frontMatter.pokemon) {
      titleEl?.querySelector(".pokemon-sticker")?.remove();
      fileExplorerItem?.querySelector(".pokemon-sticker")?.remove();
      return;
    }
    const stickerSize = this.settings.noteStickerSize;
    this.createOrUpdateSticker(
      titleEl,
      frontMatter.pokemon,
      stickerSize,
      view.file
    );
    this.createOrUpdateSticker(
      fileExplorerItem,
      frontMatter.pokemon,
      16,
      view.file
    );
  }

  createOrUpdateSticker(
    container: Element | null,
    pokemon: { name: string; image: string },
    size: number,
    file: TFile
  ) {
    if (!container) return;

    let stickerContainer = container.querySelector(
      ".pokemon-sticker"
    ) as HTMLSpanElement;

    // Determine context: if it's in the file explorer, use inline-block; otherwise, block.
    const isFileExplorer = Boolean(container.closest(".nav-file-title"));
    const displayType = isFileExplorer ? "inline-block" : "block";

    if (!stickerContainer) {
      stickerContainer = document.createElement("span");
      stickerContainer.classList.add("pokemon-sticker");
      stickerContainer.classList.add(
        displayType === "block"
          ? "pokemon-sticker--block"
          : "pokemon-sticker--inline-block"
      );

      const img = document.createElement("img");
      img.width = size;
      img.src =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"; // Placeholder
      img.classList.add("pokemon-sticker-img", "loading");
      if (isFileExplorer) {
        img.classList.add("pokemon-sticker-img--disabled");
      } else {
        img.classList.add("pokemon-sticker-img--clickable");
      }

      stickerContainer.appendChild(img);
      container.prepend(stickerContainer);

      const newImg = new Image();
      newImg.src = pokemon.image;
      newImg.onload = () => {
        img.src = pokemon.image;
        img.alt = pokemon.name;
        img.width = size;
        img.classList.remove("loading");
        img.classList.add("loaded");
      };

      if (!isFileExplorer) {
        img.addEventListener("click", (event) => {
          event.stopPropagation();
          this.showStickerModal(file);
        });
      }
    } else {
      const img = stickerContainer.querySelector("img") as HTMLImageElement;
      if (img && img.src !== pokemon.image) {
        img.src =
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

        const newImg = new Image();
        newImg.src = pokemon.image;
        newImg.onload = () => {
          img.src = pokemon.image;
          img.alt = pokemon.name;
          img.width = size;
        };
      } else {
        img.width = size;
      }

      if (isFileExplorer) {
        img.classList.remove("pokemon-sticker-img--clickable");
        img.classList.add("pokemon-sticker-img--disabled");
      } else {
        img.classList.remove("pokemon-sticker-img--disabled");
        img.classList.add("pokemon-sticker-img--clickable");
        img.addEventListener("click", (event) => {
          event.stopPropagation();
          this.showStickerModal(file);
        });
      }
    }
  }

  showStickerModal(file: TFile) {
    document.querySelector("#pokemon-sticker-modal")?.remove();

    const modal = document.createElement("div");
    modal.id = "pokemon-sticker-modal";
    modal.classList.add("pokemon-sticker-modal");

    const title = document.createElement("h3");
    title.innerText = "Modify Pokémon";
    modal.appendChild(title);

    const randomizeBtn = document.createElement("button");
    randomizeBtn.innerText = "Randomize Pokémon";
    randomizeBtn.classList.add(
      "pokemon-sticker-modal-button",
      "pokemon-sticker-btn-random"
    );

    randomizeBtn.addEventListener("click", async () => {
      modal.remove();
      await this.assignPokemonToNote(file);
      this.scheduleUpdate();
    });
    modal.appendChild(randomizeBtn);

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "Remove Pokémon";
    removeBtn.classList.add(
      "pokemon-sticker-modal-button",
      "pokemon-sticker-btn-remove"
    );

    removeBtn.addEventListener("click", async () => {
      modal.remove();
      await this.app.fileManager.processFrontMatter(file, (frontMatter) => {
        delete frontMatter["pokemon"];
      });
      this.scheduleUpdate();
    });
    modal.appendChild(removeBtn);

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    closeBtn.classList.add(
      "pokemon-sticker-modal-button",
      "pokemon-sticker-btn-close"
    );

    closeBtn.addEventListener("click", () => {
      modal.remove();
    });
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  updateFileExplorerStickers() {
    this.app.vault.getMarkdownFiles().forEach((file) => {
      const frontMatter =
        this.app.metadataCache.getFileCache(file)?.frontmatter;
      const fileNavItem = document.querySelector(
        `.nav-file-title[data-path="${file.path}"] .nav-file-title-content`
      );

      if (!fileNavItem) return;

      if (!frontMatter?.pokemon) {
        fileNavItem.querySelector(".pokemon-sticker")?.remove();
        return;
      }

      this.createOrUpdateSticker(fileNavItem, frontMatter.pokemon, 16, file);
    });
  }

  updateStickerSize() {
    this.displaySticker();
    this.updateFileExplorerStickers();

    this.app.workspace.trigger("layout-change");

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const stickers = view.containerEl.querySelectorAll(
        ".pokemon-sticker img"
      );
      stickers.forEach((img) => {
        img.setAttribute("width", `${this.settings.noteStickerSize}`);
      });
    }
  }

  onunload(): void {
    console.log("Pokemon Sticker Plugin Unloaded!");
  }
}

/** Plugin Settings Tab */
class PokemonStickerSettingTab extends PluginSettingTab {
  plugin: PokemonStickerPlugin;

  constructor(app: App, plugin: PokemonStickerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Pokémon Sticker Settings" });

    new Setting(containerEl)
      .setName("Note Sticker Size")
      .setDesc("Adjust the size of the Pokémon sticker in notes.")
      .addSlider((slider) =>
        slider
          .setLimits(20, 100, 5)
          .setValue(this.plugin.settings.noteStickerSize)
          .onChange(async (value) => {
            this.plugin.settings.noteStickerSize = value;
            await this.plugin.saveSettings();
            this.plugin.updateStickerSize();
          })
      );
  }
}

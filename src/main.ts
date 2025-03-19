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

    //    console.log(`Assigned Pokémon ${randomPokemon.name} to ${file.basename}`);
  }

  /**  Debounced update to avoid unnecessary re-renders */
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
      "block",
      view.file
    );
    this.createOrUpdateSticker(
      fileExplorerItem,
      frontMatter.pokemon,
      16,
      "inline-block",
      view.file
    );
  }

  createOrUpdateSticker(
    container: Element | null,
    pokemon: { name: string; image: string },
    size: number,
    display: string,
    file: TFile
  ) {
    if (!container) return;

    let stickerContainer = container.querySelector(
      ".pokemon-sticker"
    ) as HTMLSpanElement;

    const isFileExplorer = container.closest(".nav-file-title"); // ✅ Detect if it's in file explorer

    if (!stickerContainer) {
      stickerContainer = document.createElement("span");
      stickerContainer.className = "pokemon-sticker";
      stickerContainer.style.display = display;
      stickerContainer.style.marginRight = "8px";

      const img = document.createElement("img");
      img.width = size;
      img.src =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"; // Placeholder
      img.style.opacity = "0.5";
      img.style.cursor = isFileExplorer ? "default" : "pointer"; // ❌ Disable cursor if in file explorer

      stickerContainer.appendChild(img);
      container.prepend(stickerContainer);

      const newImg = new Image();
      newImg.src = pokemon.image;
      newImg.onload = () => {
        img.src = pokemon.image;
        img.alt = pokemon.name;
        img.width = size;
        img.style.opacity = "1";
      };

      // ✅ Only add the click event if it's inside the note (NOT in the file explorer)
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

      // ✅ Ensure the click event is only added inside the note, not in file explorer
      img.style.cursor = isFileExplorer ? "default" : "pointer";
      if (!isFileExplorer) {
        img.addEventListener("click", (event) => {
          event.stopPropagation();
          this.showStickerModal(file);
        });
      }
    }

    // ✅ Ensure the Hover Bounce Animation is Defined in CSS
    if (!document.querySelector("#pokemon-sticker-hover-animation")) {
      const style = document.createElement("style");
      style.id = "pokemon-sticker-hover-animation";
      style.textContent = `
        .pokemon-sticker img {
          transition: transform 0.3s ease-in-out;
        }
  
        .pokemon-sticker:hover img {
          animation: bounce 0.5s ease;
        }
  
        @keyframes bounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  showStickerModal(file: TFile) {
    // ✅ Ensure only one modal exists at a time
    document.querySelector("#pokemon-sticker-modal")?.remove();

    const modal = document.createElement("div");
    modal.id = "pokemon-sticker-modal"; // ✅ Assign ID for easy removal
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.background = "#333";
    modal.style.color = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "10px";
    modal.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    modal.style.textAlign = "center";
    modal.style.zIndex = "1000";

    const title = document.createElement("h3");
    title.innerText = "Modify Pokémon";
    modal.appendChild(title);

    // Randomize Button
    const randomizeBtn = document.createElement("button");
    randomizeBtn.innerText = "Randomize Pokémon";
    randomizeBtn.style.margin = "10px";
    randomizeBtn.style.padding = "10px";
    randomizeBtn.style.border = "none";
    randomizeBtn.style.cursor = "pointer";
    randomizeBtn.style.background = "#4CAF50";
    randomizeBtn.style.color = "#fff";
    randomizeBtn.style.borderRadius = "5px";

    randomizeBtn.addEventListener("click", async () => {
      modal.remove(); // Ensure modal closes first
      await this.assignPokemonToNote(file);
      this.scheduleUpdate();
    });

    modal.appendChild(randomizeBtn);

    // Remove Pokémon Button
    const removeBtn = document.createElement("button");
    removeBtn.innerText = "Remove Pokémon";
    removeBtn.style.margin = "10px";
    removeBtn.style.padding = "10px";
    removeBtn.style.border = "none";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.background = "#D32F2F";
    removeBtn.style.color = "#fff";
    removeBtn.style.borderRadius = "5px";

    removeBtn.addEventListener("click", async () => {
      modal.remove(); // ✅ Ensure modal closes first
      await this.app.fileManager.processFrontMatter(file, (frontMatter) => {
        delete frontMatter["pokemon"];
      });
      this.scheduleUpdate();
    });

    modal.appendChild(removeBtn);

    // Close Button
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    closeBtn.style.margin = "10px";
    closeBtn.style.padding = "10px";
    closeBtn.style.border = "none";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.background = "#555";
    closeBtn.style.color = "#fff";
    closeBtn.style.borderRadius = "5px";

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

      this.createOrUpdateSticker(
        fileNavItem,
        frontMatter.pokemon,
        16,
        "inline-block",
        file
      );
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

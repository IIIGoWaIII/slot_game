// slot-game.js
const app = new PIXI.Application({
  view: document.getElementById("gameCanvas"),
  width: 1270,
  height: 720,
  backgroundColor: 0x1099bb,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

globalThis.__PIXI_APP__ = app;

// Define constants for reel and symbol dimensions
const REEL_WIDTH = 100;
const REEL_HEIGHT = 300;
const SYMBOL_SIZE = 140;
const NUM_REELS = 5; // Number of columns
const NUM_ROWS = 3; // Number of rows

// Load both preloader and game spritesheets
const spritesheets = [
  "spritesheets/preloader-1.json", // Preloader spritesheet
  "spritesheets/preloader-2.json", // Preloader spritesheet
  "spritesheets/symbols.json", 
  "spritesheets/gameUI.json", 
  "spritesheets/desktopUI.json", 
];

PIXI.Assets.load(spritesheets).then(() => {
  initPreloader();
});
function initPreloader() {
  // Create root container
  const rootContainer = new PIXI.Container();
  rootContainer.name = "RootContainer";
  app.stage.addChild(rootContainer);

  // Create preloader container
  const preloaderContainer = new PIXI.Container();
  preloaderContainer.name = "PreloaderContainer";
  rootContainer.addChild(preloaderContainer);

  // Create background for the preloader
  const preloaderBackground = new PIXI.Sprite(
    PIXI.Texture.from("Loading_Screen_Background")
  );
  preloaderBackground.width = app.screen.width;
  preloaderBackground.height = app.screen.height;
  preloaderBackground.name = "preloaderBackground";
  preloaderContainer.addChild(preloaderBackground);

  // Create game logo from spritesheet
  const gameLogo = new PIXI.Sprite(PIXI.Texture.from("Game_Logo"));
  gameLogo.scale.set(0.5); // Apply scale of 0.5
  gameLogo.x = app.screen.width / 2 - gameLogo.width / 2;
  gameLogo.y = app.screen.height / 2 - gameLogo.height / 2 - 100; // Adjust position as needed
  gameLogo.name = "gameLogo";
  preloaderContainer.addChild(gameLogo);

  // Create loading text from spritesheet
  const loadingText = new PIXI.Sprite(PIXI.Texture.from("Loading..._text"));
  loadingText.x = app.screen.width / 2 - loadingText.width / 2;
  loadingText.y = app.screen.height / 2 + 200;
  loadingText.name = "loadingText";
  preloaderContainer.addChild(loadingText);

  // Create empty loading bar from spritesheet
  const loadingBarEmpty = new PIXI.Sprite(
    PIXI.Texture.from("Loading_bar_empty_1")
  );
  loadingBarEmpty.x = app.screen.width / 2 - loadingBarEmpty.width / 2;
  loadingBarEmpty.y = app.screen.height / 2 + 100;
  loadingBarEmpty.name = "loadingBarEmpty";
  preloaderContainer.addChild(loadingBarEmpty);

  // Create loading bar  design from spritesheet
  const loadingBarDesign = new PIXI.Sprite(
    PIXI.Texture.from("Loading_bar_design_3")
  );
  loadingBarDesign.x = app.screen.width / 2 - loadingBarEmpty.width / 2;
  loadingBarDesign.y = app.screen.height / 2 + 100;
  loadingBarDesign.name = "loadingBarDesign";
  preloaderContainer.addChild(loadingBarDesign);

  // Create fill for the loading bar
  const loadingBarFill = new PIXI.Sprite(
    PIXI.Texture.from("Loading_bar_fill_2")
  );
  loadingBarFill.x = loadingBarEmpty.x;
  loadingBarFill.y = loadingBarEmpty.y;
  loadingBarFill.width = 0; 
  loadingBarFill.name = "loadingBarFill";
  preloaderContainer.addChild(loadingBarFill);

  // Dummy progress animation
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 1;
    loadingBarFill.width = (loadingBarEmpty.width * progress) / 100;

    if (progress >= 100) {
      clearInterval(progressInterval);
      loadingText.visible = false; // Hide loading text
      showEnterPrompt(preloaderContainer, rootContainer); // Show enter prompt
    }
  }, 10); 
}

function showEnterPrompt(preloaderContainer, rootContainer) {
  const enterText = new PIXI.Text("Click to Enter Game", {
    fontFamily: "Trebuchet MS",
    fontSize: 32,
    fontWeight: "bold",
    fill: 0xfff2a8,
    align: "center",
    stroke: 0x3a1600,
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 6,
    dropShadowDistance: 2,
  });
  enterText.anchor.set(0.5);
  enterText.resolution = window.devicePixelRatio || 1;
  enterText.x = app.screen.width / 2;
  enterText.y = app.screen.height / 2 + 200;
  enterText.name = "continueText";
  preloaderContainer.addChild(enterText);

  // Apply pulsing animation using GSAP
  gsap.to(enterText.scale, {
    x: 1.08, // Scale to 1.08 times
    y: 1.08, // Scale to 1.08 times
    duration: 0.8, // Duration of each pulse
    repeat: -1, // Repeat indefinitely
    yoyo: true, // Reverse back to original scale
    ease: "power2.inOut", // Ease function
  });

  // Enable interaction on the stage
  app.stage.interactive = true;

  // Enable interaction to enter the game
  app.stage.once("pointerdown", () => {
    preloaderContainer.visible = false; // Hide preloader
    initGame(rootContainer);
  });
}

function createControlPanel(container, reels) {
  const controlPanelContainer = new PIXI.Container();
  controlPanelContainer.name = "ControlPanelContainer";
  container.addChild(controlPanelContainer);

  controlPanelContainer.x = 292;
  controlPanelContainer.y = 630;
  let balance = 1000; // Starting balance
  let betAmount = 10; // Starting bet
  let winAmount = 0; // Starting win

  // Balance Frame and Label
  const balanceFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));
  balanceFrame.x = 10;
  balanceFrame.y = 20;
  balanceFrame.name = "balanceFrame";
  balanceFrame.scale.set(0.5);
  controlPanelContainer.addChild(balanceFrame);

  const balanceLabel = new PIXI.Sprite(PIXI.Texture.from("Balance_Text.png"));
  balanceLabel.x = 20;
  balanceLabel.y = 10;
  balanceLabel.name = "balanceLabel";
  balanceFrame.addChild(balanceLabel);

  // Add the Balance Value Text
  const balanceValueText = new PIXI.Text(`$${balance}`, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
    align: "left",
  });
  balanceValueText.x = 250;
  balanceValueText.y = 20; 
  balanceFrame.addChild(balanceValueText);

  // Win Frame and Label
  const winFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));

  winFrame.x = 210;
  winFrame.y = 20;
  winFrame.scale.set(0.5);
  winFrame.name = "winFrame";
  controlPanelContainer.addChild(winFrame);

  const winLabel = new PIXI.Sprite(PIXI.Texture.from("Win_Text.png"));
  winLabel.x = 20;
  winLabel.y = 10;
  winLabel.name = "winLabel";
  winFrame.addChild(winLabel);

  // Add the Win Value Text
  const winValueText = new PIXI.Text(`$${winAmount}`, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
    align: "left",
  });
  winValueText.x = 250;
  winValueText.y = 20; // Positioning below the label
  winFrame.addChild(winValueText);

  // Bet Frame and Label
  const betFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));
  betFrame.x = 420;
  betFrame.y = 20;
  betFrame.scale.set(0.5);
  betFrame.name = "betFrame";
  controlPanelContainer.addChild(betFrame);

  const betLabel = new PIXI.Sprite(PIXI.Texture.from("Bet_Text.png"));
  betLabel.x = 20;
  betLabel.y = 10;
  betLabel.name = "betLabel";
  betFrame.addChild(betLabel);

  // Add the Bet Value Text
  const betValueText = new PIXI.Text(`$${betAmount}`, {
    fontFamily: "Arial",
    fontSize: 40,
    fill: 0xffffff,
    align: "center",
  });
  betValueText.x = betLabel.x  + 200;
  betValueText.y = 20; // Positioning below the label
  betFrame.addChild(betValueText);

  // Textures for Arrow Buttons
  const arrowTextures = {
    leftIdle: PIXI.Texture.from("Arrow_L_Idle.png"),
    leftHover: PIXI.Texture.from("Arrow_L_Hover.png"),
    leftPressed: PIXI.Texture.from("Arrow_L_Pressed.png"),
    rightIdle: PIXI.Texture.from("Arrow_R_Idle.png"),
    rightHover: PIXI.Texture.from("Arrow_R_Hover.png"),
    rightPressed: PIXI.Texture.from("Arrow_R_Pressed.png"),
  };

  // Decrease Bet Button
  const decreaseBetButton = new PIXI.Sprite(arrowTextures.leftIdle);
  decreaseBetButton.name = "DecreaseBetButton";
  decreaseBetButton.interactive = true;
  decreaseBetButton.buttonMode = true;
  decreaseBetButton.x = betFrame.x - 450;
  decreaseBetButton.y = betFrame.y - 25;
  betFrame.addChild(decreaseBetButton);

  // Increase Bet Button
  const increaseBetButton = new PIXI.Sprite(arrowTextures.rightIdle);
  increaseBetButton.name = "IncreaseBetButton";
  increaseBetButton.interactive = true;
  increaseBetButton.buttonMode = true;
  increaseBetButton.x = betFrame.x  - 120;
  increaseBetButton.y = betFrame.y -25;
  betFrame.addChild(increaseBetButton);

  // Event handlers for Decrease Bet Button
  decreaseBetButton.on("pointerover", () => {
    decreaseBetButton.texture = arrowTextures.leftHover;
  });
  decreaseBetButton.on("pointerout", () => {
    decreaseBetButton.texture = arrowTextures.leftIdle;
  });
  decreaseBetButton.on("pointerdown", () => {
    decreaseBetButton.texture = arrowTextures.leftPressed;
    if (betAmount > 1) {
      betAmount -= 1;
      betValueText.text = `$${betAmount}`;
    }
  });
  decreaseBetButton.on("pointerup", () => {
    decreaseBetButton.texture = arrowTextures.leftIdle;
  });

  // Event handlers for Increase Bet Button
  increaseBetButton.on("pointerover", () => {
    increaseBetButton.texture = arrowTextures.rightHover;
  });
  increaseBetButton.on("pointerout", () => {
    increaseBetButton.texture = arrowTextures.rightIdle;
  });
  increaseBetButton.on("pointerdown", () => {
    increaseBetButton.texture = arrowTextures.rightPressed;
    betAmount += 1;
    betValueText.text = `$${betAmount}`;
  });
  increaseBetButton.on("pointerup", () => {
    increaseBetButton.texture = arrowTextures.rightIdle;
  });

  const textures = {
    idle: PIXI.Texture.from("Spin_Idle.png"),
    hover: PIXI.Texture.from("Spin_Hover.png"),
    pressed: PIXI.Texture.from("Spin_Pressed.png"),
    disabled: PIXI.Texture.from("Spin_Disabled.png"),
  };

  const spinButton = new PIXI.Sprite(textures.idle);
  spinButton.name = "SpinButton";
  spinButton.interactive = true;
  spinButton.buttonMode = true;
  spinButton.x = 622;
  spinButton.y = -22;
  spinButton.scale.set(0.5);
  controlPanelContainer.addChild(spinButton);

  function disableSpinButton() {
    spinButton.texture = textures.disabled;
    spinButton.interactive = false;
    spinButton.buttonMode = false;
  }

  function enableSpinButton() {
    spinButton.texture = textures.idle;
    spinButton.interactive = true;
    spinButton.buttonMode = true;
  }

  spinButton.on("pointerover", () => {
    if (spinButton.interactive) {
      spinButton.texture = textures.hover;
    }
  });

  spinButton.on("pointerout", () => {
    if (spinButton.interactive) {
      spinButton.texture = textures.idle;
    }
  });

  spinButton.on("pointerdown", () => {
    if (balance >= betAmount) {
      spinButton.texture = textures.pressed;
      buttonSound.play(); // Play button click sound
      balance -= betAmount;
      balanceValueText.text = `$${balance}`;
      disableSpinButton();

      spinReels(reels).then(() => {
        enableSpinButton();
      });
    } else {
      console.log("Insufficient balance");
    }
  });

  spinButton.on("pointerup", () => {
    if (spinButton.interactive) {
      spinButton.texture = textures.idle;
    }
  });

// Add Info Button
const infoTextures = {
    idle: PIXI.Texture.from("Info_Idle.png"),
    hover: PIXI.Texture.from("Info_Hover.png"),
    pressed: PIXI.Texture.from("Info_Pressed.png"),
    disabled: PIXI.Texture.from("Info_Disabled.png"),
};

const infoButton = new PIXI.Sprite(infoTextures.idle);
infoButton.name = "InfoButton";
infoButton.interactive = true;
infoButton.buttonMode = true;
infoButton.x = -50;
infoButton.y = 20;
infoButton.scale.set(0.5);
controlPanelContainer.addChild(infoButton);

  const paylinePatterns = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0],
    [2, 1, 0, 1, 2],
    [1, 0, 0, 0, 1],
    [1, 2, 2, 2, 1],
    [0, 0, 1, 2, 2],
    [2, 2, 1, 0, 0],
    [1, 2, 1, 0, 1],
    [1, 0, 1, 2, 1],
    [0, 1, 1, 1, 0],
    [2, 1, 1, 1, 2],
    [0, 1, 0, 1, 0],
    [2, 1, 2, 1, 2],
    [1, 1, 0, 1, 1],
    [1, 1, 2, 1, 1],
    [0, 0, 2, 0, 0],
    [2, 2, 0, 2, 2],
    [0, 2, 1, 2, 0],
  ];
  const paytablePages = [];
  let paytablePageIndex = 0;

  // Create modal popup
  const modalContainer = new PIXI.Container();
  modalContainer.name = "modalContainer";
  modalContainer.visible = false;
  modalContainer.x = 0;
  modalContainer.y = 0;

  const blanket = new PIXI.Graphics();
  blanket.beginFill(0x000000, 0.82);
  blanket.drawRect(0, 0, app.screen.width, app.screen.height);
  blanket.endFill();
  blanket.name = "blanket";
  modalContainer.addChild(blanket);

  const modalFrame = new PIXI.Sprite(PIXI.Texture.from("reelFrame.png"));
  modalFrame.scale.set(0.56, 0.56);
  modalFrame.x = (app.screen.width - modalFrame.width) / 2;
  modalFrame.y = 74;
  modalFrame.name = "modalpopupFrame";
  modalContainer.addChild(modalFrame);
  const paytableBounds = {
    x: 145,
    y: 70,
    width: modalFrame.width - 290,
    height: modalFrame.height - 155,
  };

  const contentContainer = new PIXI.Container();
  contentContainer.name = "PaytableContent";
  modalContainer.addChild(contentContainer);

  const pageLabel = new PIXI.Text("", {
    fontFamily: "Arial",
    fontSize: 22,
    fontWeight: "bold",
    fill: 0xffffff,
    align: "center",
  });
  pageLabel.anchor.set(0.5);
  pageLabel.x = app.screen.width / 2;
  pageLabel.y = modalFrame.y + modalFrame.height - 58;
  modalContainer.addChild(pageLabel);

  function createPaytableText(text, size, fill = 0xffffff, weight = "bold") {
    return new PIXI.Text(text, {
      fontFamily: "Trebuchet MS",
      fontSize: size,
      fontWeight: weight,
      fill,
      align: "center",
      stroke: 0x1b0a00,
      strokeThickness: size >= 26 ? 4 : 2,
    });
  }

  function createPanel(x, y, width, height) {
    const panel = new PIXI.Container();
    panel.x = x;
    panel.y = y;

    const background = new PIXI.Graphics();
    background.beginFill(0x09031c, 0.88);
    background.lineStyle(2, 0xf4bd42, 0.75);
    background.drawRoundedRect(0, 0, width, height, 8);
    background.endFill();
    panel.addChild(background);

    return panel;
  }

  function addTitle(page, text) {
    const title = createPaytableText(text, 36, 0xffd94f);
    title.anchor.set(0.5, 0);
    title.x = paytableBounds.x + paytableBounds.width / 2;
    title.y = 18;
    page.addChild(title);
  }

  function addBodyText(page, text, x, y, width, size = 18) {
    const body = new PIXI.Text(text, {
      fontFamily: "Trebuchet MS",
      fontSize: size,
      fill: 0xffffff,
      align: "center",
      wordWrap: true,
      wordWrapWidth: width,
      lineHeight: size + 8,
    });
    body.anchor.set(0.5, 0);
    body.x = x;
    body.y = y;
    page.addChild(body);
  }

  function addSymbolCard(page, symbolIndex, label, payout, x, y) {
    const card = createPanel(x, y, 150, 176);
    page.addChild(card);

    const symbol = PIXI.Sprite.from(`symbol${symbolIndex}`);
    symbol.anchor.set(0.5);
    symbol.width = 92;
    symbol.height = 92;
    symbol.x = 75;
    symbol.y = 62;
    card.addChild(symbol);

    const labelText = createPaytableText(label, 17, 0xffe7a6);
    labelText.anchor.set(0.5);
    labelText.x = 75;
    labelText.y = 122;
    card.addChild(labelText);

    const payoutText = createPaytableText(payout, payout.length > 20 ? 13 : 17, 0xffffff);
    payoutText.anchor.set(0.5);
    payoutText.x = 75;
    payoutText.y = 150;
    card.addChild(payoutText);
  }

  function addPaylinePattern(page, index, pattern, x, y) {
    const label = createPaytableText(String(index + 1), 18, 0xffffff);
    label.anchor.set(1, 0.5);
    label.x = x - 8;
    label.y = y + 24;
    page.addChild(label);

    const cell = 12;
    const gap = 2;
    for (let col = 0; col < NUM_REELS; col++) {
      for (let row = 0; row < NUM_ROWS; row++) {
        const square = new PIXI.Graphics();
        square.beginFill(pattern[col] === row ? 0xff404d : 0x555766);
        square.drawRect(x + col * (cell + gap), y + row * (cell + gap), cell, cell);
        square.endFill();
        page.addChild(square);
      }
    }
  }

  function createOverviewPage() {
    const page = new PIXI.Container();
    addTitle(page, "PAYTABLE");
    addBodyText(page, "Wins pay left to right on 20 fixed paylines. Highest win only per line.", paytableBounds.x + paytableBounds.width / 2, 70, paytableBounds.width, 18);

    addSymbolCard(page, 11, "WILD", "Substitutes", paytableBounds.x + 35, 128);
    addSymbolCard(page, 10, "SCATTER", "Free Spins", paytableBounds.x + 225, 128);
    addSymbolCard(page, 9, "5X", "Multiplier", paytableBounds.x + 415, 128);

    addBodyText(page, "Land 3 or more scatters to trigger free spins. Wild symbols replace regular symbols in line wins.", paytableBounds.x + paytableBounds.width / 2, 342, paytableBounds.width, 20);
    return page;
  }

  function createSymbolPage(title, symbols, startY) {
    const page = new PIXI.Container();
    addTitle(page, title);
    symbols.forEach((symbol, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      addSymbolCard(page, symbol.index, symbol.label, symbol.payout, paytableBounds.x + 5 + col * 160, startY + row * 192);
    });
    return page;
  }

  function createPaylinesPage() {
    const page = new PIXI.Container();
    addTitle(page, "PAYLINES");
    paylinePatterns.forEach((pattern, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      addPaylinePattern(page, index, pattern, paytableBounds.x + 50 + col * 112, 105 + row * 76);
    });
    addBodyText(page, "Red cells show winning route across five reels.", paytableBounds.x + paytableBounds.width / 2, 408, paytableBounds.width, 18);
    return page;
  }

  paytablePages.push(
    createOverviewPage(),
    createSymbolPage("HIGH SYMBOLS", [
      { index: 0, label: "FOREST", payout: "5: 500  4: 100  3: 25" },
      { index: 1, label: "MUSHROOM", payout: "5: 300  4: 80  3: 20" },
      { index: 2, label: "DEER", payout: "5: 250  4: 60  3: 15" },
      { index: 3, label: "OWL", payout: "5: 200  4: 50  3: 12" },
      { index: 4, label: "SQUIRREL", payout: "5: 150  4: 40  3: 10" },
      { index: 5, label: "A", payout: "5: 100  4: 30  3: 8" },
      { index: 6, label: "K", payout: "5: 80  4: 25  3: 6" },
      { index: 7, label: "Q", payout: "5: 60  4: 20  3: 5" },
    ], 78),
    createSymbolPage("LOW SYMBOLS", [
      { index: 8, label: "J", payout: "5: 50  4: 15  3: 4" },
      { index: 9, label: "10", payout: "5: 40  4: 12  3: 3" },
      { index: 10, label: "SCATTER", payout: "Triggers free spins" },
      { index: 11, label: "WILD", payout: "Replaces symbols" },
    ], 122),
    createPaylinesPage()
  );

  paytablePages.forEach((page) => {
    page.scale.set(0.85);
    page.x = modalFrame.x + modalFrame.width * 0.075;
    page.y = modalFrame.y + 72;
    page.visible = false;
    contentContainer.addChild(page);
  });

  function layoutPaytablePage() {
    paytablePages.forEach((page, index) => {
      page.visible = index === paytablePageIndex;
    });
    pageLabel.text = `${paytablePageIndex + 1} / ${paytablePages.length}`;
  }

  function createModalButton(label, x, y, width, height, onClick) {
    const button = new PIXI.Container();
    button.interactive = true;
    button.buttonMode = true;
    button.x = x;
    button.y = y;

    const background = new PIXI.Graphics();
    background.beginFill(0x221307, 0.95);
    background.lineStyle(2, 0xffd700, 0.85);
    background.drawRoundedRect(0, 0, width, height, 8);
    background.endFill();
    button.addChild(background);

    const text = new PIXI.Text(label, {
      fontFamily: "Arial",
      fontSize: height > 48 ? 32 : 24,
      fontWeight: "bold",
      fill: 0xffffff,
      align: "center",
    });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    button.addChild(text);

    button.on("pointerover", () => {
      background.tint = 0xdddddd;
    });
    button.on("pointerout", () => {
      background.tint = 0xffffff;
    });
    button.on("pointerdown", onClick);

    modalContainer.addChild(button);
    return button;
  }

  const closeButton = createModalButton(
    "X",
    modalFrame.x + modalFrame.width - 82,
    modalFrame.y + 26,
    46,
    42,
    () => {
      modalContainer.visible = false;
    }
  );
  closeButton.name = "CloseButton";

  createModalButton(
    "<",
    modalFrame.x + 50,
    modalFrame.y + modalFrame.height - 86,
    58,
    50,
    () => {
      paytablePageIndex = (paytablePageIndex - 1 + paytablePages.length) % paytablePages.length;
      layoutPaytablePage();
    }
  );

  createModalButton(
    ">",
    modalFrame.x + modalFrame.width - 108,
    modalFrame.y + modalFrame.height - 86,
    58,
    50,
    () => {
      paytablePageIndex = (paytablePageIndex + 1) % paytablePages.length;
      layoutPaytablePage();
    }
  );

  layoutPaytablePage();

// Toggle modal visibility
function toggleModal() {
    modalContainer.visible = !modalContainer.visible;
}

// Info Button interactions
infoButton.on('pointerover', () => {
    infoButton.texture = infoTextures.hover;
});

infoButton.on('pointerout', () => {
    infoButton.texture = infoTextures.idle;
});

infoButton.on('pointerdown', () => {
    infoButton.texture = infoTextures.pressed;
    toggleModal();
});

infoButton.on('pointerup', () => {
    infoButton.texture = infoTextures.idle;
});

container.addChild(modalContainer);

}

let spinSound,
  bonusSound,
  buttonSound,
  musicMainSound,
  reelStopSound,
  scatterLandSound,
  wildLandingSound;
function setupSounds() {
  spinSound = new Howl({
    src: ["Assets/sounds/reels_spin.wav"],
  });

  bonusSound = new Howl({
    src: ["Assets/sounds/bonus_land.wav"],
  });

  buttonSound = new Howl({
    src: ["Assets/sounds/general_button.wav"],
  });

  musicMainSound = new Howl({
    src: ["Assets/sounds/music_main.wav"],
    loop: true, 
    volume: 0.3, 
  });

  reelStopSound = new Howl({
    src: ["Assets/sounds/reel_stop.wav"],
  });

  scatterLandSound = new Howl({
    src: ["Assets/sounds/scatter_land.wav"],
  });

  wildLandingSound = new Howl({
    src: ["Assets/sounds/wild_landing.wav"],
  });
}

function initGame(rootContainer) {
  // Create main game container
  const mainGameContainer = new PIXI.Container();
  mainGameContainer.name = "MainGameContainer";

  mainGameContainer.width = "100%";
  mainGameContainer.height = "100%"; 
  rootContainer.addChild(mainGameContainer);

  // Initialize the game components
  createBackground(mainGameContainer);
  const reelContainer = createReels(mainGameContainer);
  createControlPanel(mainGameContainer, reelContainer);

  setupSounds();
  musicMainSound.play();
}

function createBackground(container) {
  const background = PIXI.Sprite.from("Assets/background.png");
  background.name = "Background";
  background.width = app.screen.width;
  background.height = app.screen.height;
  container.addChild(background);
}

function createReels(container) {
  const reelContainer = new PIXI.Container();
  reelContainer.name = "ReelContainer";
  container.addChild(reelContainer);

  // Add reel frame (background for reels)
  const reelFrame = new PIXI.Sprite(PIXI.Texture.from("reelFrame.png"));
  reelFrame.scale.set(0.65, 0.7);
  reelFrame.x = -260; 
  reelFrame.y = 100;
  reelContainer.addChild(reelFrame);

   // Add game logo to the main container
   const gameLogo = new PIXI.Sprite(PIXI.Texture.from("logo.png"));
   gameLogo.scale.set(0.7); 
   gameLogo.x = reelFrame.x + 370;
   gameLogo.y =  reelFrame.y;
   reelContainer.addChild(gameLogo);

  // Add frame (the bottom UI frame) to the main container
  const bottomFrame = new PIXI.Sprite(PIXI.Texture.from("woodframe.png"));
  bottomFrame.width = app.screen.width;
  bottomFrame.x = -110;
  bottomFrame.y = 670;
  bottomFrame.scale.set(2, 0.5); 
  bottomFrame.name = "tickerPanel";
  reelContainer.addChild(bottomFrame);

  const reels = [];
  const totalReelWidth = NUM_REELS * REEL_WIDTH + (NUM_REELS - 1) * 10;

  // Center reelContainer based on the screen dimensions and reelFrame position
  reelContainer.x = (app.screen.width - totalReelWidth) / 2;
  reelContainer.y = reelFrame.y - reelFrame.height / 4;

  const tickerMessage = new PIXI.Text("Good Luck!", {
    fontFamily: "Trebuchet MS",
    fontSize: 25,
    fontWeight: "bold",
    fill: 0xfff2b0,
    align: "center",
    stroke: 0x2a1200,
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  });
  tickerMessage.anchor.set(0.5);
  tickerMessage.x = app.screen.width / 2 - reelContainer.x;
  tickerMessage.y = 616 - reelContainer.y;
  tickerMessage.name = "TickerMessage";
  reelContainer.addChild(tickerMessage);

  // Create reelStripContainer to wrap all reels
  const reelStripContainer = new PIXI.Container();
  reelStripContainer.name = "ReelStripContainer";
  reelStripContainer.x = -75;
  reelStripContainer.y = 242;

  reelContainer.addChild(reelStripContainer);

  const reelMask = new PIXI.Graphics();
  reelMask.beginFill(0xffffff);
  reelMask.drawRect(reelStripContainer.x - 20, reelStripContainer.y - 20, 750, NUM_ROWS * SYMBOL_SIZE + 35);
  reelMask.endFill();
  reelMask.name = "ReelMask";
  reelContainer.addChild(reelMask);
  reelStripContainer.mask = reelMask;

  for (let i = 0; i < NUM_REELS; i++) {
    const reel = new PIXI.Container();
    reel.name = `Reel${i}`;
    reel.x = i * (REEL_WIDTH + 50);
    reel.y = -10;
    reelStripContainer.addChild(reel);
    reels.push(reel);

    // Add random symbols to each reel using spritesheet
    for (let j = 0; j < NUM_ROWS; j++) {
      const symbolIndex = Math.floor(Math.random() * 11);
      const symbol = PIXI.Sprite.from(`symbol${symbolIndex}`);

      symbol.anchor.set(0.5);
      symbol.name = `Symbol${i}_${j}`;
      symbol.width = SYMBOL_SIZE;
      symbol.height = SYMBOL_SIZE;

      symbol.y = j * SYMBOL_SIZE + SYMBOL_SIZE / 2;
      symbol.x = REEL_WIDTH / 2;
      reel.addChild(symbol);
    }
  }

  return reels;
}

function spinReels(reels) {
    return new Promise((resolve) => {
        spinSound.play();

        const spinSpeed = 18;
        const stopDelay = 0.2;
        let finishedReelsCount = 0;
        const gsapTweens = [];

        const originalPositions = reels.map((reel) =>
            reel.children.map((symbol) => symbol.y)
        );

        function spinReel(reel, reelIndex) {
            const tween = gsap.to(reel, {
                duration: 1,
                ease: "none",
                repeat: -1,
                onUpdate: () => {
                    reel.children.forEach((symbol) => {
                        symbol.y += spinSpeed;

                        if (symbol.y >= NUM_ROWS * SYMBOL_SIZE) {
                            symbol.y -= NUM_ROWS * SYMBOL_SIZE;
                            const symbolIndex = Math.floor(Math.random() * 11);
                            symbol.texture = PIXI.Texture.from(`symbol${symbolIndex}`);
                        }
                    });
                }
            });

            gsapTweens.push(tween);

            gsap.delayedCall(1, () => {
                gsapTweens[reelIndex].kill();

                reelStopSound.play();

                let settledSymbols = 0;
                reel.children.forEach((symbol, symbolIndex) => {
                    gsap.to(symbol, {
                        y: originalPositions[reelIndex][symbolIndex],
                        duration: 0.22,
                        ease: "power2.out",
                        onComplete: () => {
                            settledSymbols++;
                            if (settledSymbols !== reel.children.length) {
                                return;
                            }

                        finishedReelsCount++;

                        if (finishedReelsCount === reels.length) {
                            bonusSound.play();
                            resolve();
                        }
                        },
                    });
                });
            });
        }

        reels.forEach((reel, reelIndex) => {
            gsap.delayedCall(reelIndex * stopDelay, () => {
                spinReel(reel, reelIndex);
            });
        });
    });
}  

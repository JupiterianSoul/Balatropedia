
export interface ShopRates {
  jokerRate: number;
  tarotRate: number;
  planetRate: number;
  playingCardRate: number;
  spectralRate: number;
}

export interface JokerStickers {
  eternal: boolean;
  perishable: boolean;
  rental: boolean;
}

export interface JokerData {
  joker: string;
  rarity: string;
  edition: string;
  stickers: JokerStickers;
}

export interface ShopItem {
  type: string;
  item: string;
  jokerData?: JokerData;
}

export interface WeightedItem {
  item: string;
  weight: number;
}

export interface Pack {
  type: string;
  size: number;
  choices: number;
}

export interface StandardCard {
  base: string;
  enhancement: string;
  edition: string;
  seal: string;
}

export const ENHANCEMENTS: string[] = [
  "Bonus", "Mult", "Wild", "Glass", "Steel", "Stone", "Gold", "Lucky",
];

export const CARDS: string[] = [
  "C_2","C_3","C_4","C_5","C_6","C_7","C_8","C_9","C_A","C_J","C_K","C_Q","C_T",
  "D_2","D_3","D_4","D_5","D_6","D_7","D_8","D_9","D_A","D_J","D_K","D_Q","D_T",
  "H_2","H_3","H_4","H_5","H_6","H_7","H_8","H_9","H_A","H_J","H_K","H_Q","H_T",
  "S_2","S_3","S_4","S_5","S_6","S_7","S_8","S_9","S_A","S_J","S_K","S_Q","S_T",
];

export const SUITS: string[] = ["Spades", "Hearts", "Clubs", "Diamonds"];
export const RANKS: string[] = [
  "2","3","4","5","6","7","8","9","10","Jack","Queen","King","Ace",
];

export const PACKS: WeightedItem[] = [
  { item: "RETRY", weight: 22.42 },
  { item: "Arcana Pack", weight: 4 },
  { item: "Jumbo Arcana Pack", weight: 2 },
  { item: "Mega Arcana Pack", weight: 0.5 },
  { item: "Celestial Pack", weight: 4 },
  { item: "Jumbo Celestial Pack", weight: 2 },
  { item: "Mega Celestial Pack", weight: 0.5 },
  { item: "Standard Pack", weight: 4 },
  { item: "Jumbo Standard Pack", weight: 2 },
  { item: "Mega Standard Pack", weight: 0.5 },
  { item: "Buffoon Pack", weight: 1.2 },
  { item: "Jumbo Buffoon Pack", weight: 0.6 },
  { item: "Mega Buffoon Pack", weight: 0.15 },
  { item: "Spectral Pack", weight: 0.6 },
  { item: "Jumbo Spectral Pack", weight: 0.3 },
  { item: "Mega Spectral Pack", weight: 0.07 },
];

export const TAROTS: string[] = [
  "The Fool","The Magician","The High Priestess","The Empress","The Emperor",
  "The Hierophant","The Lovers","The Chariot","Justice","The Hermit",
  "The Wheel of Fortune","Strength","The Hanged Man","Death","Temperance",
  "The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World",
];

export const PLANETS: string[] = [
  "Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto",
  "Planet X","Ceres","Eris",
];

export const COMMON_JOKERS_100: string[] = [
  "Joker","Greedy Joker","Lusty Joker","Wrathful Joker","Gluttonous Joker",
  "Jolly Joker","Zany Joker","Mad Joker","Crazy Joker","Droll Joker",
  "Sly Joker","Wily Joker","Clever Joker","Devious Joker","Crafty Joker",
  "Half Joker","Credit Card","Banner","Mystic Summit","8 Ball","Misprint",
  "Raised Fist","Chaos the Clown","Scary Face","Abstract Joker",
  "Delayed Gratification","Gros Michel","Even Steven","Odd Todd","Scholar",
  "Business Card","Supernova","Ride the Bus","Egg","Runner","Ice Cream",
  "Splash","Blue Joker","Faceless Joker","Green Joker","Superposition",
  "To Do List","Cavendish","Red Card","Square Joker","Riff-raff","Photograph",
  "Mail In Rebate","Hallucination","Fortune Teller","Juggler","Drunkard",
  "Golden Joker","Popcorn","Walkie Talkie","Smiley Face","Golden Ticket",
  "Swashbuckler","Hanging Chad","Shoot the Moon",
];

export const COMMON_JOKERS: string[] = [
  "Joker","Greedy Joker","Lusty Joker","Wrathful Joker","Gluttonous Joker",
  "Jolly Joker","Zany Joker","Mad Joker","Crazy Joker","Droll Joker",
  "Sly Joker","Wily Joker","Clever Joker","Devious Joker","Crafty Joker",
  "Half Joker","Credit Card","Banner","Mystic Summit","8 Ball","Misprint",
  "Raised Fist","Chaos the Clown","Scary Face","Abstract Joker",
  "Delayed Gratification","Gros Michel","Even Steven","Odd Todd","Scholar",
  "Business Card","Supernova","Ride the Bus","Egg","Runner","Ice Cream",
  "Splash","Blue Joker","Faceless Joker","Green Joker","Superposition",
  "To Do List","Cavendish","Red Card","Square Joker","Riff-raff","Photograph",
  "Reserved Parking","Mail In Rebate","Hallucination","Fortune Teller",
  "Juggler","Drunkard","Golden Joker","Popcorn","Walkie Talkie","Smiley Face",
  "Golden Ticket","Swashbuckler","Hanging Chad","Shoot the Moon",
];

export const UNCOMMON_JOKERS_100: string[] = [
  "Joker Stencil","Four Fingers","Mime","Ceremonial Dagger","Marble Joker",
  "Loyalty Card","Dusk","Fibonacci","Steel Joker","Hack","Pareidolia",
  "Space Joker","Burglar","Blackboard","Constellation","Hiker","Card Sharp",
  "Madness","Vampire","Shortcut","Hologram","Vagabond","Cloud 9","Rocket",
  "Midas Mask","Luchador","Gift Card","Turtle Bean","Erosion","Reserved Parking",
  "To the Moon","Stone Joker","Lucky Cat","Bull","Diet Cola","Trading Card",
  "Flash Card","Spare Trousers","Ramen","Seltzer","Castle","Mr. Bones","Acrobat",
  "Sock and Buskin","Troubadour","Certificate","Smeared Joker","Throwback",
  "Rough Gem","Bloodstone","Arrowhead","Onyx Agate","Glass Joker","Showman",
  "Flower Pot","Merry Andy","Oops! All 6s","The Idol","Seeing Double","Matador",
  "Stuntman","Satellite","Cartomancer","Astronomer","Burnt Joker","Bootstraps",
];

export const UNCOMMON_JOKERS_101C: string[] = [
  "Joker Stencil","Four Fingers","Mime","Ceremonial Dagger","Marble Joker",
  "Loyalty Card","Dusk","Fibonacci","Steel Joker","Hack","Pareidolia",
  "Space Joker","Burglar","Blackboard","Sixth Sense","Constellation","Hiker",
  "Card Sharp","Madness","Seance","Shortcut","Hologram","Cloud 9","Rocket",
  "Midas Mask","Luchador","Gift Card","Turtle Bean","Erosion","To the Moon",
  "Stone Joker","Lucky Cat","Bull","Diet Cola","Trading Card","Flash Card",
  "Spare Trousers","Ramen","Seltzer","Castle","Mr. Bones","Acrobat",
  "Sock and Buskin","Troubadour","Certificate","Smeared Joker","Throwback",
  "Rough Gem","Bloodstone","Arrowhead","Onyx Agate","Glass Joker","Showman",
  "Flower Pot","Merry Andy","Oops! All 6s","The Idol","Seeing Double","Matador",
  "Stuntman","Satellite","Cartomancer","Astronomer","Bootstraps",
];

export const UNCOMMON_JOKERS: string[] = [
  "Joker Stencil","Four Fingers","Mime","Ceremonial Dagger","Marble Joker",
  "Loyalty Card","Dusk","Fibonacci","Steel Joker","Hack","Pareidolia",
  "Space Joker","Burglar","Blackboard","Sixth Sense","Constellation","Hiker",
  "Card Sharp","Madness","Seance","Vampire","Shortcut","Hologram","Cloud 9",
  "Rocket","Midas Mask","Luchador","Gift Card","Turtle Bean","Erosion",
  "To the Moon","Stone Joker","Lucky Cat","Bull","Diet Cola","Trading Card",
  "Flash Card","Spare Trousers","Ramen","Seltzer","Castle","Mr. Bones",
  "Acrobat","Sock and Buskin","Troubadour","Certificate","Smeared Joker",
  "Throwback","Rough Gem","Bloodstone","Arrowhead","Onyx Agate","Glass Joker",
  "Showman","Flower Pot","Merry Andy","Oops! All 6s","The Idol","Seeing Double",
  "Matador","Satellite","Cartomancer","Astronomer","Bootstraps",
];

export const RARE_JOKERS_100: string[] = [
  "DNA","Sixth Sense","Seance","Baron","Obelisk","Baseball Card","Ancient Joker",
  "Campfire","Blueprint","Wee Joker","Hit the Road","The Duo","The Trio",
  "The Family","The Order","The Tribe","Invisible Joker","Brainstorm",
  "Drivers License",
];

export const RARE_JOKERS_101C: string[] = [
  "DNA","Vampire","Vagabond","Baron","Obelisk","Baseball Card","Ancient Joker",
  "Campfire","Blueprint","Wee Joker","Hit the Road","The Duo","The Trio",
  "The Family","The Order","The Tribe","Invisible Joker","Brainstorm",
  "Drivers License","Burnt Joker",
];

export const RARE_JOKERS: string[] = [
  "DNA","Vagabond","Baron","Obelisk","Baseball Card","Ancient Joker","Campfire",
  "Blueprint","Wee Joker","Hit the Road","The Duo","The Trio","The Family",
  "The Order","The Tribe","Stuntman","Invisible Joker","Brainstorm",
  "Drivers License","Burnt Joker",
];

export const LEGENDARY_JOKERS: string[] = [
  "Canio","Triboulet","Yorick","Chicot","Perkeo",
];

export const VOUCHERS: string[] = [
  "Overstock","Overstock Plus","Clearance Sale","Liquidation","Hone","Glow Up",
  "Reroll Surplus","Reroll Glut","Crystal Ball","Omen Globe","Telescope",
  "Observatory","Grabber","Nacho Tong","Wasteful","Recyclomancy","Tarot Merchant",
  "Tarot Tycoon","Planet Merchant","Planet Tycoon","Seed Money","Money Tree",
  "Blank","Antimatter","Magic Trick","Illusion","Hieroglyph","Petroglyph",
  "Director's Cut","Retcon","Paint Brush","Palette",
];

export const SPECTRALS: string[] = [
  "Familiar","Grim","Incantation","Talisman","Aura","Wraith","Sigil","Ouija",
  "Ectoplasm","Immolate","Ankh","Deja Vu","Hex","Trance","Medium","Cryptid",
  "RETRY","RETRY",
];

export const TAGS: string[] = [
  "Uncommon Tag","Rare Tag","Negative Tag","Foil Tag","Holographic Tag",
  "Polychrome Tag","Investment Tag","Voucher Tag","Boss Tag","Standard Tag",
  "Charm Tag","Meteor Tag","Buffoon Tag","Handy Tag","Garbage Tag","Ethereal Tag",
  "Coupon Tag","Double Tag","Juggle Tag","D6 Tag","Top-up Tag","Speed Tag",
  "Orbital Tag","Economy Tag",
];

export const BOSSES: string[] = [
  "The Arm","The Club","The Eye","Amber Acorn","Cerulean Bell","Crimson Heart",
  "Verdant Leaf","Violet Vessel","The Fish","The Flint","The Goad","The Head",
  "The Hook","The House","The Manacle","The Mark","The Mouth","The Needle",
  "The Ox","The Pillar","The Plant","The Psychic","The Serpent","The Tooth",
  "The Wall","The Water","The Wheel","The Window",
];

export const DECKS: string[] = [
  "Red Deck","Blue Deck","Yellow Deck","Green Deck","Black Deck","Magic Deck",
  "Nebula Deck","Ghost Deck","Abandoned Deck","Checkered Deck","Zodiac Deck",
  "Painted Deck","Anaglyph Deck","Plasma Deck","Erratic Deck",
];

export const STAKES: string[] = [
  "White Stake","Red Stake","Green Stake","Black Stake","Blue Stake",
  "Purple Stake","Orange Stake","Gold Stake",
];

export function packInfo(pack: string): Pack {
  if (pack[0] === "M") {
    return { type: pack.substring(5), size: (pack[5] === "B" || pack[6] === "p") ? 4 : 5, choices: 2 };
  } else if (pack[0] === "J") {
    return { type: pack.substring(6), size: (pack[6] === "B" || pack[7] === "p") ? 4 : 5, choices: 1 };
  } else {
    return { type: pack, size: (pack[0] === "B" || pack[1] === "p") ? 2 : 3, choices: 1 };
  }
}

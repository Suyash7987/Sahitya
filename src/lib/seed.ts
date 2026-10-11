import bcrypt from "bcryptjs";
import { Book } from "@/models/Book";
import { User } from "@/models/User";

const SAMPLE_ITEMS = [
  {
    kind: "book",
    title: "Gitanjali",
    language: "English",
    code: "GIT-001",
    price: 299,
    stock: 18,
    description: "A collection of poems that won Tagore the Nobel Prize in Literature.",
  },
  {
    kind: "book",
    title: "Godan",
    language: "Hindi",
    code: "GOD-001",
    price: 249,
    stock: 22,
    description: "A landmark Hindi novel on rural life, debt, and dignity.",
  },
  {
    kind: "book",
    title: "Malgudi Days",
    language: "English",
    code: "MAL-001",
    price: 320,
    stock: 20,
    description: "Short stories from the fictional town of Malgudi.",
  },
  {
    kind: "book",
    title: "Wings of Fire",
    language: "English",
    code: "WOF-001",
    price: 275,
    stock: 25,
    description: "The autobiography of India's Missile Man.",
  },
  {
    kind: "accessory",
    title: "Bookmark",
    language: "",
    code: "",
    price: 0,
    stock: 40,
    description: "",
  },
  {
    kind: "accessory",
    title: "Canvas tote bag",
    language: "",
    code: "",
    price: 0,
    stock: 12,
    description: "",
  },
];

export async function seedIfEmpty() {
  const [userCount, bookCount] = await Promise.all([
    User.countDocuments(),
    Book.countDocuments(),
  ]);

  if (userCount === 0) {
    const [adminHash, deskHash] = await Promise.all([
      bcrypt.hash("admin123", 10),
      bcrypt.hash("desk123", 10),
    ]);

    await User.insertMany([
      {
        name: "Library Admin",
        username: "admin",
        passwordHash: adminHash,
        role: "admin",
      },
      {
        name: "Front Desk",
        username: "desk",
        passwordHash: deskHash,
        role: "desk",
      },
    ]);
  }

  if (bookCount === 0) {
    await Book.insertMany(SAMPLE_ITEMS);
  }
}

import express from "express";
import { openrouter } from "../services/ai";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are an AI competitor intelligence assistant.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
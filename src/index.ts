import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "At least email or phoneNumber must be provided"
      });
    }

    
    const existingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email ?? undefined },
          { phoneNumber: phoneNumber ?? undefined }
        ]
      },
      orderBy: { createdAt: "asc" }
    });

    
    if (existingContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary"
        }
      });

      return res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        }
      });
    }

    
    let primaryContact =
      existingContacts.find(c => c.linkPrecedence === "primary") ||
      existingContacts[0];

    
    for (const contact of existingContacts) {
      if (
        contact.linkPrecedence === "primary" &&
        contact.id !== primaryContact.id
      ) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: primaryContact.id
          }
        });
      }
    }

    // Check if exact combination already exists
    const exactMatch = existingContacts.find(
      c => c.email === email && c.phoneNumber === phoneNumber
    );

    if (!exactMatch) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "secondary",
          linkedId: primaryContact.id
        }
      });
    }

    // Fetch all linked contacts
    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ]
      }
    });

    const emails = Array.from(
      new Set(allContacts.map(c => c.email).filter(Boolean))
    ) as string[];

    const phoneNumbers = Array.from(
      new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))
    ) as string[];

    const secondaryContactIds = allContacts
      .filter(c => c.linkPrecedence === "secondary")
      .map(c => c.id);

    return res.status(200).json({
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
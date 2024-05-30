import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Contact } from '../models/contact';

const contactsFilePath = path.join(__dirname,'..','..','src', 'data', 'contacts.json');


const readContactsFromFile = (): Contact[] => {
  const data = fs.readFileSync(contactsFilePath, 'utf8');
  return JSON.parse(data);
};

const writeContactsToFile = (contacts: Contact[]) => {
  fs.writeFileSync(contactsFilePath, JSON.stringify(contacts, null, 2));
};

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;
  const contacts = readContactsFromFile();

  try {
    // Find existing contacts by email or phoneNumber
    const existingContacts = contacts.filter(contact =>
      (contact.email === email && email) || (contact.phoneNumber === phoneNumber && phoneNumber)
    );

    if (existingContacts.length === 0) {
      // Create new primary contact
      const newContact: Contact = {
        id: contacts.length ? Math.max(...contacts.map(c => c.id)) + 1 : 1,
        email,
        phoneNumber,
        linkPrecedence: 'primary',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined
      };
      contacts.push(newContact);
      writeContactsToFile(contacts);

      return res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: [newContact.email],
          phoneNumbers: [newContact.phoneNumber],
          secondaryContactIds: []
        }
      });
    }

    // Find primary and secondary contacts
    let primaryContact: Contact | null = null;
    const secondaryContacts: Contact[] = [];

    for (const contact of existingContacts) {
      if (contact.linkPrecedence === 'primary') {
        primaryContact = contact;
      } else {
        secondaryContacts.push(contact);
      }
    }

    // If no primary contact found, find the oldest contact and set as primary
    if (!primaryContact) {
      primaryContact = existingContacts.reduce((oldest, contact) =>
        contact.createdAt < oldest.createdAt ? contact : oldest, existingContacts[0]);
      primaryContact.linkPrecedence = 'primary';
    }

    // Create secondary contact if needed
    if (!existingContacts.some(c => c.email === email && c.phoneNumber === phoneNumber)) {
      const newSecondaryContact: Contact = {
        id: contacts.length ? Math.max(...contacts.map(c => c.id)) + 1 : 1,
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: 'secondary',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined
      };
      contacts.push(newSecondaryContact);
      secondaryContacts.push(newSecondaryContact);
    }

    writeContactsToFile(contacts);

    const emails = Array.from(new Set([primaryContact.email, ...secondaryContacts.map(c => c.email)].filter(e => e)));
    const phoneNumbers = Array.from(new Set([primaryContact.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)].filter(p => p)));

    return res.status(200).json({
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

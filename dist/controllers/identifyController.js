"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyContact = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const contactsFilePath = path_1.default.join(__dirname, '..', '..', 'src', 'data', 'contacts.json');
const readContactsFromFile = () => {
    const data = fs_1.default.readFileSync(contactsFilePath, 'utf8');
    return JSON.parse(data);
};
const writeContactsToFile = (contacts) => {
    fs_1.default.writeFileSync(contactsFilePath, JSON.stringify(contacts, null, 2));
};
const identifyContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    const contacts = readContactsFromFile();
    try {
        // Find existing contacts by email or phoneNumber
        const existingContacts = contacts.filter(contact => (contact.email === email && email) || (contact.phoneNumber === phoneNumber && phoneNumber));
        if (existingContacts.length === 0) {
            // Create new primary contact
            const newContact = {
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
        let primaryContact = null;
        const secondaryContacts = [];
        for (const contact of existingContacts) {
            if (contact.linkPrecedence === 'primary') {
                primaryContact = contact;
            }
            else {
                secondaryContacts.push(contact);
            }
        }
        // If no primary contact found, find the oldest contact and set as primary
        if (!primaryContact) {
            primaryContact = existingContacts.reduce((oldest, contact) => contact.createdAt < oldest.createdAt ? contact : oldest, existingContacts[0]);
            primaryContact.linkPrecedence = 'primary';
        }
        // Create secondary contact if needed
        if (!existingContacts.some(c => c.email === email && c.phoneNumber === phoneNumber)) {
            const newSecondaryContact = {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
exports.identifyContact = identifyContact;

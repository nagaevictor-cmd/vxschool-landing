// Simple Telegram Bot for handling callbacks
// This is a basic webhook handler for Telegram bot callbacks

const express = require('express');
const fs = require('fs');
const path = require('path');

// This should be integrated into your main server.js or run as a separate service
// For now, here's the webhook handler function you can add to server.js

function handleTelegramWebhook(req, res) {
  const update = req.body;
  
  if (update.callback_query) {
    const callbackData = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    
    if (callbackData === 'view_contacts') {
      // Send contacts summary
      sendContactsSummary(chatId, messageId);
    } else if (callbackData.startsWith('mark_processed_')) {
      const contactId = callbackData.replace('mark_processed_', '');
      markContactAsProcessed(contactId, chatId, messageId);
    } else if (callbackData.startsWith('mark_spam_')) {
      const contactId = callbackData.replace('mark_spam_', '');
      markContactAsSpam(contactId, chatId, messageId);
    }
  }
  
  res.status(200).json({ ok: true });
}

async function sendContactsSummary(chatId, messageId) {
  try {
    const contactsFile = path.join(__dirname, 'data', 'contacts.json');
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    
    const today = new Date().toDateString();
    const todayContacts = contacts.filter(c => new Date(c.createdAt).toDateString() === today);
    const weekContacts = contacts.filter(c => {
      const contactDate = new Date(c.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return contactDate >= weekAgo;
    });
    
    const summary = `📊 <b>Статистика заявок</b>

📅 <b>Сегодня:</b> ${todayContacts.length}
📈 <b>За неделю:</b> ${weekContacts.length}
📋 <b>Всего:</b> ${contacts.length}

<b>Последние 5 заявок:</b>
${contacts.slice(0, 5).map(contact => 
  `• ${contact.name} (@${contact.telegram.replace('@', '')}) - ${contact.tariff || 'Без тарифа'}`
).join('\n')}`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔗 Открыть админ панель',
            url: `https://vxschool.ru/admin/`
          }
        ]
      ]
    };

    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: summary,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Error sending contacts summary:', error);
  }
}

async function markContactAsProcessed(contactId, chatId, messageId) {
  try {
    // Add processed status to contact (you can extend the contact structure)
    const contactsFile = path.join(__dirname, 'data', 'contacts.json');
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      contacts[contactIndex].status = 'processed';
      contacts[contactIndex].processedAt = new Date().toISOString();
      fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2), 'utf8');
    }

    // Update message
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Заявка обработана',
              callback_data: 'processed'
            }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error marking contact as processed:', error);
  }
}

async function markContactAsSpam(contactId, chatId, messageId) {
  try {
    // Mark as spam and optionally move to spam folder
    const contactsFile = path.join(__dirname, 'data', 'contacts.json');
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      const spamContact = contacts[contactIndex];
      spamContact.status = 'spam';
      spamContact.markedSpamAt = new Date().toISOString();
      
      // Remove from main contacts
      contacts.splice(contactIndex, 1);
      fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2), 'utf8');
      
      // Save to spam file
      const spamFile = path.join(__dirname, 'data', 'spam_contacts.json');
      let spamContacts = [];
      if (fs.existsSync(spamFile)) {
        spamContacts = JSON.parse(fs.readFileSync(spamFile, 'utf8'));
      }
      spamContacts.push(spamContact);
      fs.writeFileSync(spamFile, JSON.stringify(spamContacts, null, 2), 'utf8');
    }

    // Update message
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🗑️ Помечено как спам',
              callback_data: 'spam'
            }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error marking contact as spam:', error);
  }
}

module.exports = {
  handleTelegramWebhook,
  sendContactsSummary,
  markContactAsProcessed,
  markContactAsSpam
};
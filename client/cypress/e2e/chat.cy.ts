describe('Chat Functionality', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/servers');
  });

  it('should send and receive messages', () => {
    // Join a server and channel
    cy.get('[data-cy="server-list"]').first().click();
    cy.get('[data-cy="channel-list"]').first().click();

    // Send a message
    const message = 'Hello, this is a test message! ' + Date.now();
    cy.get('[data-cy="message-input"]').type(message);
    cy.get('[data-cy="send-button"]').click();

    // Verify message appears in chat
    cy.get('[data-cy="message-list"]')
      .should('contain', message)
      .and('contain', 'testuser');
  });

  it('should handle emoji reactions', () => {
    // Join a server and channel
    cy.get('[data-cy="server-list"]').first().click();
    cy.get('[data-cy="channel-list"]').first().click();

    // Open emoji picker and add reaction
    cy.get('[data-cy="message-actions"]').first().trigger('mouseover');
    cy.get('[data-cy="add-reaction"]').click();
    cy.get('[data-cy="emoji-picker"]').should('be.visible');
    cy.get('[data-cy="emoji-👍"]').click();

    // Verify reaction appears
    cy.get('[data-cy="message-reactions"]')
      .should('contain', '👍')
      .and('contain', '1');
  });

  it('should upload files', () => {
    // Join a server and channel
    cy.get('[data-cy="server-list"]').first().click();
    cy.get('[data-cy="channel-list"]').first().click();

    // Upload file
    cy.get('[data-cy="file-input"]').attachFile('test-image.jpg');

    // Verify file appears in chat
    cy.get('[data-cy="message-attachment"]')
      .should('be.visible')
      .and('contain', 'test-image.jpg');
  });

  it('should handle message editing and deletion', () => {
    // Join a server and channel
    cy.get('[data-cy="server-list"]').first().click();
    cy.get('[data-cy="channel-list"]').first().click();

    // Send a message
    const originalMessage = 'Message to edit ' + Date.now();
    cy.get('[data-cy="message-input"]').type(originalMessage);
    cy.get('[data-cy="send-button"]').click();

    // Edit message
    cy.get('[data-cy="message-actions"]').first().trigger('mouseover');
    cy.get('[data-cy="edit-message"]').click();
    const editedMessage = 'Edited message ' + Date.now();
    cy.get('[data-cy="message-edit-input"]')
      .clear()
      .type(editedMessage);
    cy.get('[data-cy="save-edit"]').click();

    // Verify edited message
    cy.get('[data-cy="message-content"]')
      .first()
      .should('contain', editedMessage)
      .and('contain', '(edited)');

    // Delete message
    cy.get('[data-cy="message-actions"]').first().trigger('mouseover');
    cy.get('[data-cy="delete-message"]').click();
    cy.get('[data-cy="confirm-delete"]').click();

    // Verify message is deleted
    cy.get('[data-cy="message-content"]')
      .first()
      .should('not.contain', editedMessage);
  });
});

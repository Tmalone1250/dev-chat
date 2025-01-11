describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should register a new user', () => {
    cy.get('[data-cy="register-link"]').click();
    cy.get('[data-cy="username-input"]').type('testuser');
    cy.get('[data-cy="email-input"]').type('test@example.com');
    cy.get('[data-cy="password-input"]').type('password123');
    cy.get('[data-cy="confirm-password-input"]').type('password123');
    cy.get('[data-cy="register-button"]').click();

    cy.url().should('include', '/servers');
    cy.get('[data-cy="user-profile"]').should('contain', 'testuser');
  });

  it('should login an existing user', () => {
    cy.get('[data-cy="email-input"]').type('test@example.com');
    cy.get('[data-cy="password-input"]').type('password123');
    cy.get('[data-cy="login-button"]').click();

    cy.url().should('include', '/servers');
    cy.get('[data-cy="user-profile"]').should('contain', 'testuser');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-cy="email-input"]').type('wrong@example.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-button"]').click();

    cy.get('[data-cy="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid email or password');
  });

  it('should logout user', () => {
    // Login first
    cy.login('test@example.com', 'password123');

    // Then logout
    cy.get('[data-cy="user-menu"]').click();
    cy.get('[data-cy="logout-button"]').click();

    cy.url().should('equal', Cypress.config().baseUrl + '/');
    cy.get('[data-cy="login-button"]').should('be.visible');
  });
});

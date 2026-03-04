describe('Authentication & Navigation', () => {
    const uniqueId = Date.now();
    const username = `user${uniqueId}`;
    const email = `user${uniqueId}@example.com`;
    const password = 'password123';

    it('should allow a user to register', () => {
        cy.visit('/auth');

        // Switch to Register
        cy.contains('Register').click();

        // Fill form
        cy.get('#username').type(username);
        cy.get('#email').type(email);
        cy.get('#password').type(password);
        cy.get('#confirmPassword').type(password);

        // Submit
        cy.get('button[type="submit"]').click();

        // Assert redirection to home
        cy.url().should('eq', 'http://localhost:5173/');

        // Assert logged in state (e.g., "Log a Meal" section is visible or specific auth-only element)
        // Based on Home.jsx, if authenticated, <MealLog /> is shown.
        // If not authenticated, "Log a Meal" section with link is shown.
        // Let's check for absence of "login or register" link which is present when !isAuthenticated
        cy.contains('login or register').should('not.exist');
    });

    it('should allow a user to login and navigate', () => {
        // We need the user to exist. Since tests might run in random order or parallel, 
        // we should probably register a new user for this test too, or handle it.
        // For simplicity, let's register a NEW user for this test.
        const loginId = Date.now() + 1;
        const loginUser = `login${loginId}`;
        const loginEmail = `login${loginId}@example.com`;

        // Register first (setup)
        cy.visit('/auth');
        cy.contains('Register').click();
        cy.get('#username').type(loginUser);
        cy.get('#email').type(loginEmail);
        cy.get('#password').type(password);
        cy.get('#confirmPassword').type(password);
        cy.get('button[type="submit"]').click();

        // Logout (clear storage/cookies) to test login
        cy.clearLocalStorage();
        cy.reload();

        // Now Login
        cy.visit('/auth');
        cy.get('#email').type(loginEmail);
        cy.get('#password').type(password);
        cy.get('button[type="submit"]').click();

        // Assert Success
        cy.url().should('eq', 'http://localhost:5173/');
        cy.contains('login or register').should('not.exist');

        // Navigation Test: Go to About page
        cy.get('a[href="/about"]').click(); // Assuming there is a link to About
        cy.url().should('include', '/about');
        cy.contains('About').should('exist');
    });
});

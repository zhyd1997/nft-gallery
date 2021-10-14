/* eslint-disable indent */


/* eslint-disable no-undef */
describe('Navigate to Gallery', () => {


    it('Navigate to the Gallery page', () => {
        cy.visit('http://localhost:9090/rmrk/gallery')
        cy.wait(2000)
    })

    it('Search for term', () => {
        cy.get('.input').type('generative', { force: true })
    })

    it('Click on Next page', () => {
        cy.get(':nth-child(3) > .pagination > .pagination-next > .icon').click()

    })
})
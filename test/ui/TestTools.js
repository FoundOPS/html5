/**
 * Generates test tools in the context of a function
 * @return {Object}
 * @constructor
 */
function TestTools() {
    /**
     * Click the first element a selector returns
     * @param selector
     */
    this.click = function (selector) {
        var button = $(selector).get(0);
        jasmineui.simulate(button, 'click');
    };

    /**
     * Choose a section by clicking on the navigator
     * @param section
     */
    this.choose = function (section) {
        this.click('#sideBarSections a[href$="' + section + '.html"]');
    };
};
var TestTools = function () {
    /**
     * Select a section by clicking on the navigator
     * @param section
     */
    var selectSection = function (section) {
        var button = $('#sideBarSections a[href$="' + section + '.html"]').get(0);
        jasmineui.simulate(button, 'click');
    };

    /**
     * Simulate a mouseup on an item in a jquery selector
     * @param selector The jquery selector
     * @param [index] Defaults to 0
     */
    var selectItem = function (selector, index) {
        var link = $(selector).get(0);
        jasmineui.simulate(link, 'mouseup');
    };

    /**
     * Checks there is at least one item inside a selector
     * @param selector
     */
    var expectItem = function (selector) {
        expect($(selector).size()).toBeGreaterThan(1);
    };

    return {
        selectSection: selectSection,
        selectItem: selectItem,
        expectItem: expectItem
    };
}();

define(["../db/saveHistory", "parameters", "kendo"], function (saveHistory, parameters) {
    /**
     * Setup the base class for an entity section that acts like a linked list with url parameters.
     * When it selects an entity, it sets that on the vm as nextEntity.
     * It adds that entity's Id to the url parameter and moves to the next section.
     * When shown, it will try to move forward if the nextIdParameter is available in the url parameters.
     * @param nextSectionName The name of the next section. Ex. routeDestinationDetails
     * @param nextIdParameter The name of the next section's Id query parameter. Ex. routeDestinationId
     * @param onShow (Optional) A function to call when the view is shown
     */
    var create = function (nextSectionName, nextIdParameter, onShow) {
        var section = {}, vm = kendo.observable();
        section.vm = vm;

        /**
         * a function on the vm to select an entity and
         * move forward to the next section
         * @param e.dataItem should be the entity
         * @param replace If it should replace the current hash instead of adding a new one to history.
         */
        vm.select = function (e, replace) {
            vm.set("nextEntity", e.dataItem);

            var query = parameters.get();
            query[nextIdParameter] = e.dataItem.Id;

            parameters.set(query, replace, nextSectionName);
        };

        /**
         * Try to select the next entity if it is part of the query parameters
         */
        section._moveForward = function () {
            var params = parameters.get();
            var dataSource = vm.get("dataSource");
            if (!params[nextIdParameter] || !dataSource) {
                return;
            }

            var nextEntity = _.find(dataSource.data(), function (ne) {
                return ne.Id === params[nextIdParameter];
            });
            if (nextEntity) {
                vm.select({dataItem: nextEntity}, true);
                return true;
            }
            return false;
        };

        section.show = function () {
            saveHistory.close();

            if (section._moveForward()) {
                return;
            }

            if (onShow) {
                onShow();
            }
        };

        return section;
    };

    return create;
});
define(["db/saveHistory", "tools", "lib/kendo.all"], function (saveHistory, tools) {
    /**
     * Setup the base class for an entity section with a list, and a next section to jump to
     * @param idParameter The name of the current section's Id query parameter. Ex. routeId
     * @param previousSection The previous section object
     * @param nextSectionName The name of the next section. Ex. routeDestinationDetails
     * @param nextIdParameter The name of the next section's Id query parameter. Ex. routeDestinationId
     * @param onShow (Optional) A function to call when the view is shown
     * @param dataSourceEntityProperty (Optional) The property on the selected entity to setup the dataSource from
     */
    var create = function (idParameter, previousSection, nextSectionName, nextIdParameter, onShow, dataSourceEntityProperty) {
        var section = {}, vm = kendo.observable();
        section.vm = vm;

        //setup a function on the vm to select an entity and
        //move to the next section
        vm.select = function (e) {
            vm.set("selectedEntity", e.dataItem);

            var query = tools.getParameters();
            query[nextIdParameter] = e.dataItem.Id;

            main.setHash(nextSectionName, query);
        };

        /**
         * Try to select the next entity if it is part of the query parameters.
         */
        section._moveForward = function () {
            var params = tools.getParameters();
            var dataSource = vm.dataSource;
            if (!params[nextIdParameter] || !dataSource) {
                return;
            }

            var nextEntity = _.find(dataSource.data(), function (ne) {
                return ne.Id === params[nextIdParameter];
            });
            if (nextEntity) {
                vm.select({dataItem: nextEntity});
                return true;
            }
            return false;
        };

        /**
         * Select the proper entity and setup the dataSource
         * If not possible move back.
         * If possible, try to move forward
         * @return {Boolean} True if it successfully setup
         */
        var setupDataSource = function () {
            var parentDataSource = previousSection.vm.dataSource;
            var query = tools.getParameters();

            //if the source has not been initialized or there is not a query parameter: move back
            if (!parentDataSource || !query[idParameter]) {
                section.onBack();
                return false;
            }

            var entity = _.find(parentDataSource.data(), function (e) {
                return query[idParameter] === e.Id;
            });

            //if the entity cannot be found, move back
            if (!entity) {
                section.onBack();
                return false;
            }

            section.vm.set("selectedEntity", entity);

            vm.set("dataSource",
                new kendo.data.DataSource({
                    data: entity[dataSourceEntityProperty]
                }));

            return true;
        };

        section.show = function () {
            saveHistory.close();

            if (dataSourceEntityProperty) {
                setupDataSource();
            }

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
window.L.ArrowIcon = window.L.Icon.extend({
    iconUrl: "../img/arrow.png",
    iconSize: new window.L.Point(26, 26),
    iconAnchor: new window.L.Point(12, 12),
    shadowSize: new window.L.Point(0, 0)
});

window.L.ArrowMarker = window.L.Marker.extend({
    _reset: function () {
        var pos = this._map.latLngToLayerPoint(this._latlng).round();

        window.L.DomUtil.setPosition(this._icon, pos);

        this._icon.style.WebkitTransform += ' rotate(' + this.options.angle + 'deg)';
        this._icon.style.MozTransform = 'rotate(' + this.options.angle + 'deg)';
        this._icon.style.msTransform = 'rotate(' + this.options.angle + 'deg)';
        this._icon.style.OTransform = 'rotate(' + this.options.angle + 'deg)';
    }
});

window.L.DivIcon = window.L.Icon.extend({
    options: {
        number: '',
        iconSize: new window.L.Point(0, 0),
        iconAnchor: new window.L.Point(0, 0),
        popupAnchor: new window.L.Point(30, 0),
        shadowSize: new window.L.Point(0, 0),
        className: 'leaflet-div-icon'
    },
    createIcon: function () {
        var div = document.createElement('div');
        //Next 4 lines were custom added
        var numdiv = document.createElement('div');
        numdiv.setAttribute("class", "number");
        numdiv.innerHTML = this.options['number'] || '';
        div.appendChild(numdiv);
        this._setIconStyles(div, 'icon');
        return div;
    },
    createShadow: function () {
        return null;
    },
    initialize: function (options) {
        window.L.Util.setOptions(this, options);
    },
    _setIconStyles: function (img, name) {
        var options = this.options,
			            size = options[name + 'Size'],
			            anchor = options.iconAnchor;
        if (!anchor && size) {
            anchor = size.divideBy(2, true);
        }
        if (name === 'shadow' && anchor && options.shadowOffset) {
            anchor._add(options.shadowOffset);
        }
        img.className = 'leaflet-marker-' + name + ' ' + options.className;
        if (anchor) {
            img.style.marginLeft = (-anchor.x) + 'px';
            img.style.marginTop = (-anchor.y) + 'px';
        }
        if (size) {
            img.style.width = size.x + 'px';
            img.style.height = size.y + 'px';
        }
    }
});
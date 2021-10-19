import 'ol/ol.css';
import "ol-ext/dist/ol-ext.css";
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import Projection from 'ol/proj/Projection';
import VectorTileSource from 'ol/source/VectorTile';
import View from 'ol/View';
import {Control, FullScreen, defaults as defaultControls} from 'ol/control';
import {
    Tile as TileLayer,
    VectorTile as VectorTileLayer,
    Group as LayerGroup
} from 'ol/layer';
import XYZ from 'ol/source/XYZ';
import {fromLonLat} from "ol/proj";
import geojsonvt from "geojson-vt";
import Swipe from "ol-ext/control/Swipe";
import './data/WashingtonBoundaries';
import './data/CambodiaBoundaries';
import {motorwayStyle, trunkStyle, primaryStyle, secondaryStyle, tertiaryStyle, boundaryStyle} from './data/mapStyles';

// DOM elements
const numRegionsData = document.getElementById('num-regions')
const primaryData = document.getElementById('primary-data')
const secondaryData = document.getElementById('secondary-data')
const tertiaryData = document.getElementById('tertiary-data')
const stateDropdownList = document.getElementById('state-dropdown-list')
const motorwayCheckbox = document.getElementById('motorway-checkbox')
const trunkCheckbox = document.getElementById('trunk-checkbox')
const primaryCheckbox = document.getElementById('primary-checkbox')
const secondaryCheckbox = document.getElementById('secondary-checkbox')
const tertiaryCheckbox = document.getElementById('tertiary-checkbox')
const beforeAfterButton = document.getElementById('before-after-button')
const dataTypeText = document.getElementById('data-type-text')
const countryTabList = document.getElementById('country-tab-list')
const removeBoundaryButton = document.getElementById('remove-boundary-button')

// state variables
let activeBoundaryLayer = {};
let stadiaMapCropped = {};
let activeCountry = 'Washington';
let startingCountry = 'Washington'
let activeStateZoom = {};
let zoomStarted = false;
let mode = "button";
let dataDate = 'Before';

let countries = [
    {
        'name': 'Washington',
        'data': {},
        'center': [-120.876761, 47.301355],
        'zoom': 7.5,
        'start_date': '10 years ago',
        'end_date': 'Now',
        'boundaries': washingtonBoundaries,
        'num_regions_data': 39,
        'primary_data': '744%',
        'secondary_data': '429%',
        'tertiary_data': '777%',
        'data_loaded': false
    },
    {
        'name': 'Cambodia',
        'data': {},
        'center': [104.980753, 12.095556],
        'zoom': 7.5,
        'start_date': '10 years ago',
        'end_date': 'Now',
        'boundaries': cambodiaBoundaries,
        'num_regions_data': 25,
        'primary_data': '2980%',
        'secondary_data': '902%',
        'tertiary_data': '1161%',
        'data_loaded': false
    }
]

function updateCountryInfo(country) {
    numRegionsData.innerHTML = country.num_regions_data
    primaryData.innerHTML = "<i class='fas fa-plus'></i>" + country.primary_data
    secondaryData.innerHTML = "<i class='fas fa-plus'></i>" + country.secondary_data
    tertiaryData.innerHTML = "<i class='fas fa-plus'></i>" + country.tertiary_data
    if (mode === 'button') {
        if (dataDate === 'Before') {
            dataTypeText.innerHTML = country.start_date
        } else if (dataDate === 'After') {
            dataTypeText.innerHTML = country.end_date
        }
    } else { // slider mode
        dataTypeText.innerHTML = 'Slide right to see after →'
    }
}

function renderCountryTabs(countries) {
    countries.forEach(country => {
        let li = document.createElement('li')
        li.setAttribute('id', country.name.toLowerCase() + '-tab')
        if (country.name === startingCountry) {
            li.classList.add('is-active')
        }
        let a = document.createElement('a')
        a.append(country.name)
        li.append(a)
        countryTabList.append(li)
        const countryTab = document.getElementById(country.name.toLowerCase() + '-tab')
        countryTab.addEventListener('click', switchTabs)
        if (country.name === startingCountry) {
            updateCountryInfo(country)
        }
    })
}

renderCountryTabs(countries)

function LoadData(countryName) {
    console.log('fetching ' + countryName + ' data...')
    toggleSpinner("on")
    Promise.all([
        fetch(`https://passionfruition.github.io/data/${countryName}/tertiary_after.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/tertiary_before.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/secondary_after.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/secondary_before.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/primary_after.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/primary_before.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/trunk_after.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/trunk_before.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/motorway_after.geojson`),
        fetch(`https://passionfruition.github.io/data/${countryName}/motorway_before.geojson`),
    ]).then((responses) => {
        return Promise.all(responses.map(response => {
            return response.json()
        }))
    }).then((data) => {
        data.forEach((layer) => {
            let layerName = layer.features[0].properties['layer'] // String name of classification
            let style = []
            let zIndex = 0
            // Determine style and z-index for classifications
            if (layerName.startsWith('motorway')) {
                style = motorwayStyle
                zIndex = 5
            } else if (layerName.startsWith('trunk')) {
                style = trunkStyle
                zIndex = 4
            } else if (layerName.startsWith('primary')) {
                style = primaryStyle
                zIndex = 3
            } else if (layerName.startsWith('secondary')) {
                style = secondaryStyle
                zIndex = 2
            } else if (layerName.startsWith('tertiary')) {
                style = tertiaryStyle
                zIndex = 1
            }
            countries.forEach(country => {
                if(countryName === country.name) {
                    let mapLayer = createLayer(layer, style)
                    mapLayer.setZIndex(zIndex)
                    country.data[layerName] = mapLayer
                }
            })
        })
    }).then(() => {
        if (mode === 'button') {
            AddButtonLayers(activeCountry, dataDate)
        } else { // mode === 'slider'
            AddSliderLayers()
        }
        toggleSpinner('off')
        console.log(activeCountry + ' data fetched.')
    }).then(() => {
        countries.forEach(country => {
            if(countryName === country.name) {
                country.data_loaded = true
            }
        })
    }).catch(err => console.warn('Something went wrong. ' + err))
}

LoadData(startingCountry)

tertiaryCheckbox.addEventListener('change', (event) => toggleClassification(event, tertiaryCheckbox, 'tertiary'))
secondaryCheckbox.addEventListener('change', (event) => toggleClassification(event, secondaryCheckbox, 'secondary'))
primaryCheckbox.addEventListener('change', (event) => toggleClassification(event, primaryCheckbox, 'primary'))
trunkCheckbox.addEventListener('change', (event) => toggleClassification(event, trunkCheckbox, 'trunk'))
motorwayCheckbox.addEventListener('change', (event) => toggleClassification(event, motorwayCheckbox, 'motorway'))

function AddButtonLayers(countryName, dataDate) {
    let layers = {}
    map.removeControl(ctrl)
    beforeAfterButton.style.display = "inline-block"
    modeButton.innerHTML = 'Switch to slider mode'
    countries.forEach(country => {
        if (countryName === country.name) {
            layers = country.data
            if (dataDate === 'Before') {
                dataTypeText.innerHTML = country.start_date
            } else { // dataDate === 'After
                dataTypeText.innerHTML = country.end_date
            }
        }
    })
    // Add layers to map
    Object.keys(layers).forEach(key => {
        let classificationCheckbox = getCheckedClassification(key)
        if (key.endsWith(dataDate + 'Layer') && classificationCheckbox.checked) {
            map.addLayer(layers[key])
        }
    })
}

function resetMapLayers() {
    // Remove all layers from map
    map.setLayerGroup(new LayerGroup({layers: [stadiaMap]}));
}

// Renders classifications based on checkboxes
function toggleClassification(event, classificationCheckbox, classification) {
    let layers = {}
    countries.forEach(country => {
        if (activeCountry === country.name) {
            layers = country.data
        }
    })
    if (classificationCheckbox.checked) {
        if (mode === 'button') {
            map.removeLayer(layers[classification + dataDate + 'Layer'])
            map.addLayer(layers[classification + dataDate + 'Layer'])
        } else { // slider mode
            map.removeLayer(layers[classification + 'BeforeLayer'])
            map.removeLayer(layers[classification + 'AfterLayer'])
            map.addLayer(layers[classification + 'BeforeLayer'])
            map.addLayer(layers[classification + 'AfterLayer'])
        }
    } else {
        if (mode === 'button') {
            map.removeLayer(layers[classification + dataDate + 'Layer'])
        } else { // slider mode
            map.removeLayer(layers[classification + 'BeforeLayer'])
            map.removeLayer(layers[classification + 'AfterLayer'])
        }
    }
}

function getCheckedClassification(key) {
    let checkbox;
    if (key.startsWith('motorway')) {
        checkbox = motorwayCheckbox;
    } else if (key.startsWith('trunk')) {
        checkbox = trunkCheckbox;
    } else if (key.startsWith('primary')) {
        checkbox = primaryCheckbox;
    } else if (key.startsWith('secondary')) {
        checkbox = secondaryCheckbox;
    } else if (key.startsWith('tertiary')) {
        checkbox = tertiaryCheckbox;
    }
    return checkbox;
}

function renderDropdownStates (countryName) {
    let boundaryData = {}
    countries.forEach(country => {
        if (countryName === country.name) {
            boundaryData = country.boundaries
        }
    })
    boundaryData.features.forEach(boundary => {
        let a = document.createElement("a")
        a.classList.add("dropdown-item")
        a.classList.add("state-selector")
        a.setAttribute("id", boundary.properties.name)
        a.append(boundary.properties.name)
        stateDropdownList.append(a)
    })
    let stateSelectors = document.getElementsByClassName('state-selector')
    for (let i = 0; i < stateSelectors.length; i++) {
        stateSelectors[i].addEventListener('click', zoomToState, false)
    }
}

renderDropdownStates(startingCountry);
let stateSelectors = document.getElementsByClassName('state-selector')
for (let i = 0; i < stateSelectors.length; i++) {
    stateSelectors[i].addEventListener('click', zoomToState, false)
}

// Converts geojson-vt data to GeoJSON
var replacer = function (key, value) {
    if (value.geometry) {
        var type;
        var rawType = value.type;
        var geometry = value.geometry;

        if (rawType === 1) {
            type = 'MultiPoint';
            if (geometry.length == 1) {
                type = 'Point';
                geometry = geometry[0];
            }
        } else if (rawType === 2) {
            type = 'MultiLineString';
            if (geometry.length == 1) {
                type = 'LineString';
                geometry = geometry[0];
            }
        } else if (rawType === 3) {
            type = 'Polygon';
            if (geometry.length > 1) {
                type = 'MultiPolygon';
                geometry = [geometry];
            }
        }

        return {
            'type': 'Feature',
            'geometry': {
                'type': type,
                'coordinates': geometry,
            },
            'properties': value.tags,
        };
    } else {
        return value;
    }
};

// Creates layer to add to map
function createLayer(classification, style) {
    var tileIndex = geojsonvt(classification, {
        extent: 4096,
        // Simplification tolerance
        tolerance: 1,
        // Disable logging
        debug: 0
    });
    var format = new GeoJSON({
        // Data returned from geojson-vt is in tile pixel units
        dataProjection: new Projection({
            code: 'TILE_PIXELS',
            units: 'tile-pixels',
            extent: [0, 0, 4096, 4096],
        }),
    });
    var vectorSource = new VectorTileSource({
        tileUrlFunction: function (tileCoord) {
            // Use the tile coordinate as a pseudo URL for caching purposes
            return JSON.stringify(tileCoord);
        },
        tileLoadFunction: function (tile, url) {
            var tileCoord = JSON.parse(url);
            var data = tileIndex.getTile(
                tileCoord[0],
                tileCoord[1],
                tileCoord[2]
            );
            var geojson = JSON.stringify(
                {
                    type: 'FeatureCollection',
                    features: data ? data.features : [],
                },
                replacer
            );
            var features = format.readFeatures(geojson, {
                extent: vectorSource.getTileGrid().getTileCoordExtent(tileCoord),
                featureProjection: map.getView().getProjection(),
            });
            tile.setFeatures(features);
        },
    });
    return new VectorTileLayer({
        source: vectorSource,
        style: style
    });
}

function switchTabs(event) {
    let previousCountry = activeCountry
    activeCountry = event.target.innerHTML
    map.removeLayer(activeBoundaryLayer)
    map.removeLayer(stadiaMapCropped)
    resetMapLayers()
    removeBoundaryButton.style.display = 'none'
    // addCountryLayers(activeCountry, dataDate)
    countries.forEach(country => {
        if (activeCountry === country.name) {
            if (!country.data_loaded) {
                LoadData(activeCountry)
            } else { // country data already loaded
                if (mode === 'button') {
                    AddButtonLayers(activeCountry, dataDate)
                } else { // mode === 'slider'
                    AddSliderLayers()
                }
            }
            zoomToCoordinates(country.center, country.zoom)
            updateCountryInfo(country)
        }
    })
    let activeTab = document.getElementById(activeCountry.toLowerCase() + '-tab')
    let previousTab = document.getElementById(previousCountry.toLowerCase() + '-tab')
    previousTab.className = ''
    activeTab.className = 'is-active'
    stateDropdownList.innerHTML = ''
    renderDropdownStates(activeCountry)
}

function toggleBeforeAfter() {
    countries.forEach(country => {
        if (country.name === activeCountry) {
            if (dataDate === 'Before') {
                dataDate = 'After'
                dataTypeText.innerHTML = country.end_date
                beforeAfterButton.innerHTML = 'Show roads before'
            } else { // dataDate === 'After
                dataDate = 'Before'
                dataTypeText.innerHTML = country.start_date
                beforeAfterButton.innerHTML = 'Show roads after'
            }
        }
    })
    resetMapLayers()
    AddButtonLayers(activeCountry, dataDate)
}

beforeAfterButton.addEventListener('click', toggleBeforeAfter)

function removeBoundary() {
    map.removeLayer(stadiaMapCropped)
    map.removeLayer(activeBoundaryLayer)
    activeStateZoom.classList.remove('is-active')
    removeBoundaryButton.style.display = 'none'
}

removeBoundaryButton.addEventListener('click', removeBoundary)

function zoomToCoordinates(coordinates, zoom) {
    map.setView(new View({
        center: fromLonLat(coordinates),
        zoom: zoom,
        // max zoom for geojson-vt
        maxZoom: 15
    }))
}

function zoomToState(event) {
    if (zoomStarted) {
        activeStateZoom.classList.remove('is-active')
        map.removeLayer(activeBoundaryLayer)
        map.removeLayer(stadiaMapCropped)
    }
    let boundaryData = {}
    countries.forEach(country => {
        if (activeCountry === country.name) {
            boundaryData = country.boundaries
        }
    })
    let selectedState = event.target.innerHTML
    boundaryData.features.forEach(boundary => {
        if (boundary.properties.name === selectedState) {
            let coordinates = [boundary.properties.xcoord, boundary.properties.ycoord]
            zoomToCoordinates(coordinates, boundary.properties.zoom)
            zoomStarted = true
            activeStateZoom = document.getElementById(boundary.properties.name)
            activeStateZoom.classList.add('is-active')
            stadiaMapCropped = new ol.layer.Tile({
                source: new XYZ({
                    url: 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                    attributions: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                }),
            });
            stadiaMapCropped.setZIndex(10)
            let type = boundary.geometry.type
            let coords = boundary.geometry.coordinates
            let geom = type === 'Polygon' ? new ol.geom.Polygon(coords) : new ol.geom.MultiPolygon(coords)
            geom.transform ("EPSG:4326", map.getView().getProjection());
            let f = new ol.Feature(geom)
            let crop = new ol.filter.Crop({feature: f, inner: true})
            map.addLayer(stadiaMapCropped)
            stadiaMapCropped.addFilter(crop)
            activeBoundaryLayer = createLayer(boundary, boundaryStyle)
            activeBoundaryLayer.setZIndex(11)
            map.addLayer(activeBoundaryLayer)
            removeBoundaryButton.style.display = "inline-block"
        }
    })
}

class HomeZoom extends Control {
    constructor(opt_options) {
        const options = opt_options || {};
        const button = document.createElement('button');
        button.innerHTML = "<i class='fas fa-home'></i>";
        const element = document.createElement('div');
        element.className = 'ol-control custom-button'
        element.appendChild(button);
        super({
            element: element,
            target: options.target,
        });
        button.addEventListener('click', this.handleHomeZoom.bind(this), false)
    }

    handleHomeZoom() {
        let center = []
        let zoom = 0
        countries.forEach(country => {
            if (activeCountry === country.name) {
                center = country.center
                zoom = country.zoom
            }
        })
        this.getMap().setView(new View({
            center: fromLonLat(center),
            zoom: zoom,
            // max zoom for geojson-vt
            maxZoom: 15
        }))
    }
}

// Initialize dark basemap from Stadia Maps
let stadiaMap = new TileLayer({
    source: new XYZ({
        url: 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }),
});

stadiaMap.setZIndex(0)

let center = []
let zoom = 0
countries.forEach(country => {
    if (startingCountry === country.name) {
        center = country.center
        zoom = country.zoom
    }
})

// Initialize map
const map = new Map({
    target: 'map',
    layers: [stadiaMap],
    view: new View({
        center: fromLonLat(center),
        zoom: zoom,
        // max zoom for geojson-vt
        maxZoom: 15
    }),
    controls: defaultControls({
        //zoom: false
    }).extend([
        new HomeZoom(),
        new FullScreen()
    ])
})

function toggleSpinner(status) {
    const loadingModal = document.getElementById('loading-modal')
    const html = document.querySelector('html')
    if (status === "on") {
        loadingModal.classList.add('is-active')
        html.classList.add('is-clipped')
    } else { // if spinner off
        loadingModal.classList.remove('is-active')
        html.classList.remove('is-clipped')
    }
}

const modeButton = document.getElementById('mode-button')
let ctrl = new ol.control.Swipe();

modeButton.addEventListener('click', () => {
    resetMapLayers()
    if (mode === 'button') {
        mode = 'slider'
        AddSliderLayers()
    } else { // mode === 'slider'
        mode = 'button'
        AddButtonLayers(activeCountry, dataDate)
    }
})
function AddSliderLayers() {
    map.addControl(ctrl)
    beforeAfterButton.style.display = "none"
    modeButton.innerHTML = 'Switch to button mode'
    dataTypeText.innerHTML = 'Slide right to see after →'
    let layers = {}
    countries.forEach(country => {
        if (activeCountry === country.name) {
            layers = country.data
        }
    })
    Object.keys(layers).forEach(key => {
        let classificationCheckbox = getCheckedClassification(key)
        if (classificationCheckbox.checked) {
            map.addLayer(layers[key])
        }
        if (key.endsWith('BeforeLayer')) {
            ctrl.addLayer(layers[key], true)
        } else if (key.endsWith('AfterLayer')) {
            ctrl.addLayer(layers[key])
        }
    })
}
// Define highway and border styling
import {Stroke, Style} from "ol/style";

let motorwayStyle = [
    new Style({
        stroke: new Stroke({
            color: '#800080',
            width: 5,
        }),
    }), new Style({
        stroke: new Stroke({
            color: '#DA70D6',
            width: 3,
        }),
    })
];

let trunkStyle = [
    new Style({
        stroke: new Stroke({
            color: '#0000FF',
            width: 4,
        }),
    }), new Style({
        stroke: new Stroke({
            color: '#add8e6',
            width: 2,
        }),
    })
];

let primaryStyle = [
    new Style({
        stroke: new Stroke({
            color: '#FF0000',
            width: 4,
        }),
    }), new Style({
        stroke: new Stroke({
            color: '#FF7F7F',
            width: 2,
        }),
    })
];

let secondaryStyle = [
    new Style({
        stroke: new Stroke({
            color: '#FFA500',
            width: 4,
        }),
    }), new Style({
        stroke: new Stroke({
            color: '#FFD580',
            width: 2,
        }),
    })
];

let tertiaryStyle = [
    new Style({
        stroke: new Stroke({
            color: '#FFFF00',
            width: 4,
        }),
    }), new Style({
        stroke: new Stroke({
            color: '#FFFF99',
            width: 2,
        }),
    })
];

let boundaryStyle = [
    new Style({
        stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.5)',
            width: 4
        }),
    })
];

export {motorwayStyle, trunkStyle, primaryStyle, secondaryStyle, tertiaryStyle, boundaryStyle};
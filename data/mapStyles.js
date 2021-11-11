// Define highway and border styling
import {Stroke, Style} from "ol/style";

let motorwayStyle = [
    // new Style({
    //     stroke: new Stroke({
    //         color: '#22577a',
    //         width: 5,
    //     }),
    // }), 
    new Style({
        stroke: new Stroke({
            color: '#22577a',
            width: 3,
        }),
    })
];

let trunkStyle = [
    // new Style({
    //     stroke: new Stroke({
    //         color: '#38a3a5',
    //         width: 4,
    //     }),
    // }), 
    new Style({
        stroke: new Stroke({
            color: '#38a3a5',
            width: 2,
        }),
    })
];

let primaryStyle = [
    // new Style({
    //     stroke: new Stroke({
    //         color: '#57cc99',
    //         width: 4,
    //     }),
    // }), 
    new Style({
        stroke: new Stroke({
            color: '#57cc99',
            width: 2,
        }),
    })
];

let secondaryStyle = [
    // new Style({
    //     stroke: new Stroke({
    //         color: '#80ed99',
    //         width: 4,
    //     }),
    // }), 
    new Style({
        stroke: new Stroke({
            color: '#80ed99',
            width: 2,
        }),
    })
];

let tertiaryStyle = [
    // new Style({
    //     stroke: new Stroke({
    //         color: '#c7f9cc',
    //         width: 4,
    //     }),
    // }), 
    new Style({
        stroke: new Stroke({
            color: '#c7f9cc',
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
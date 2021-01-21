import {SeatMap} from "./engine.js";

window.onload = () => {
    let seatMap = new SeatMap("seat_canvas", "unselect_seat_span", "map_status")
        .addRect({top: 10, left: 10, width: 20, height: 20})
        .addRect({top: 10, left: 40, width: 20, height: 20})
        .addRect({top: 10, left: 70, width: 20, height: 20})

    seatMap.painting()

    seatMap.addRectInner({top: 10, left: 100, width: 20, height: 20})
    seatMap.painting()
}

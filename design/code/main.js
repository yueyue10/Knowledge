import {SeatMap} from "./engine.js";

window.onload = () => {
    let seatMap = new SeatMap("seat_canvas", "unselect_seat_span", "map_status",
        "error_hint", "reset_zoom_btn", "set_translate_btn", "context-menu"
        , "auto_add_btn")

    seatMap.painting()
}

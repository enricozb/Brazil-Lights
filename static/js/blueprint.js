var width, height;

function cap(x, min, max) {
    if (x < min) {
        return min;
    }

    if (x > max) {
        return max;
    }

    return x;
}

function interpolate_color(percent) {
    var start_color = {r: 204, g: 204, b: 204};
    var end_color = {r: 170, g: 255, b: 170};
    
    // interpolated color
    var ic = {
        r: percent * (end_color.r - start_color.r) + start_color.r,
        g: percent * (end_color.g - start_color.g) + start_color.g,
        b: percent * (end_color.b - start_color.b) + start_color.b
    };

    return 'rgb(' + ic.r + ', ' + ic.g + ', ' + ic.b + ')';
}

function light(area, action) {
    var xmlHttp = new XMLHttpRequest()
    var url = "/lights"
    xmlHttp.open("POST", url, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Content-type", "application/json");
    var data = JSON.stringify({"area": area, "action": action})
    xmlHttp.send(data)
}

function dimmer(area, action, value) {
    var xmlHttp = new XMLHttpRequest()
    var url = "/dimmer"
    xmlHttp.open("POST", url, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Content-type", "application/json");
    var data = JSON.stringify({"area": area, "action": action, "value": value})
    xmlHttp.send(data)
}

function compute_dimensions() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        local_width = w.innerWidth || e.clientWidth || g.clientWidth,
        local_height = w.innerHeight|| e.clientHeight|| g.clientHeight;

    width = local_width - 100;
    height = local_height - 100;
}

var style_on = {
  stroke: "#333",
  "stroke-width": 2,
  "stroke-linejoin": "round",
  cursor: "pointer",
};

var style_off = {
  fill: "#faa",
  stroke: "#b71c1c",
  "stroke-width": 2,
  "stroke-linejoin": "round",
  cursor: "pointer",
};

var text_style = {
  'font-size': 40,
  cursor: "pointer",
}

rooms = {}

function shape(paper, x, y, w, h, area, action, on, options=[]) {
    x *= width / 900.0
    w *= width / 900.0
    y *= height / 800.0
    h *= height / 800.0

    if (!(area in rooms)) {
        rooms[area] = []
    }

    var rect = paper.rect(x, y, w, h);

    if (on === 'on') {
        rooms[area].push(rect);
        rect.attr(style_on);
        rect.attr('fill', interpolate_color(0));
    }
    else {
        rect.attr(style_off);
    }

    // on click, press the button, and change styles 
    // for respective buttons
    var click_handler = function() {
            light(area, action);
            if (on !== 'on') {
                room_rects = rooms[area];
                for (var i = 0; i < room_rects.length; i++) {
                    room_rects[i].attr('fill', interpolate_color(0));
                }
            }
            else {
                rect.attr('fill', interpolate_color(1));
                rect.x_percent = 1;
                rect.y_percent = 1;
            }
        };

    rect.drag_dx = 0;
    rect.drag_dy = 0;
    rect.x_percent = 0;
    rect.y_percent = 0;
    rect.did_drag = false;

    // on drag, use dx & dy to compute new dimming values
    var drag_handler = function(dx, dy, _, _, e) {
            rect.did_drag = true;

            var x_percent, y_percent;

            rect.drag_dx = dx * 1.0 / w;
            rect.drag_dy = -(dy * 1.0 / h);

            x_percent = cap(rect.x_percent + rect.drag_dx, 0, 1);
            y_percent = cap(rect.y_percent + rect.drag_dy, 0, 1);
                
            if (w * 1.0 / h < 1.5) {
                rect.attr('fill', interpolate_color(y_percent));
            }
            else {
                rect.attr('fill', interpolate_color(x_percent));
            }

        };

    // on drag end, 2 cases: if it was a click, treat it like
    // a click. If it was an actual drag, change (x/y)_percent
    var drag_end_handler = function() {
            console.log('drag ended');
            if (rect.did_drag === false) {
                click_handler();
            }
            else {
                rect.x_percent = cap(rect.x_percent + rect.drag_dx, 0, 1);
                rect.y_percent = cap(rect.y_percent + rect.drag_dy, 0, 1);

                if (w * 1.0 / h < 1.5)  { 
                    dimmer(area, action, ~~(rect.y_percent * 255));
                }
                else {
                    dimmer(area, action, ~~(rect.x_percent * 255));
                }
            }
            rect.drag_dx = 0;
            rect.drag_dy = 0;
            rect.did_drag = false;
        };


    if (options.includes('dimmer')) {
        rect.drag(drag_handler, undefined, drag_end_handler);
    }
    else {
        rect.click(click_handler);
    }

    // Label
    setTimeout(function(){
        // Some weird bug in Raphael has the y-height doubled
        rect.text = paper.text(x + w/2, (y + h / 2)/2 + 5, action);
        rect.text.attr(text_style);
        if (options.includes('rotate')) {
            rect.text.rotate(90, x + w/2, (y + h / 2));
        }
        if (options.includes('dimmer')) {
            rect.text.drag(drag_handler, undefined, drag_end_handler);
        }
        else {
            rect.text.click(click_handler);
        }
    });
}

function create_canvas(name) {
    var div = document.getElementById(name);
    div.innerHTML = "";
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px';
    return paper
}

function kitchen() {
    var paper = create_canvas("kitchen_canvas"); 

    shape(paper, 350, 50, 100, 700, 'kitchen', 'lateral', 'on', ['rotate']);
    shape(paper, 450, 50, 400, 150, 'kitchen', 'sink', 'on');
    shape(paper, 450, 200, 400, 400, 'kitchen', 'island', 'on');
    shape(paper, 450, 600, 400, 150, 'kitchen', 'center', 'on');

    shape(paper, 50, 50, 250, 700, 'kitchen', 'off', 'off');
}

function living_room() {
    var paper = create_canvas("living_room_canvas"); 

    shape(paper, 350, 50, 400, 550, 'living room', 'center', 'on', ['dimmer']);
    shape(paper, 750, 50, 100, 550, 'living room', 'inner lateral', 'on', ['rotate', 'dimmer']);
    shape(paper, 350, 600, 500, 150, 'living room', 'outer lateral', 'on', ['dimmer']);

    shape(paper, 50, 50, 250, 700, 'living room', 'off', 'off');

    // Sliders

}

function enrico() {
    var paper = create_canvas("enrico_canvas"); 

    shape(paper, 350, 50, 500, 150, 'enrico', 'window', 'on');
    shape(paper, 350, 200, 500, 550, 'enrico', 'center', 'on');

    shape(paper, 50, 50, 250, 700, 'enrico', 'off', 'off');
}

function marina() {
    var paper = create_canvas("marina_canvas"); 

    shape(paper, 350, 50, 100, 700, 'marina', 'bed', 'on', ['rotate']);
    shape(paper, 450, 50, 300, 700, 'marina', 'center', 'on');
    shape(paper, 750, 50, 100, 700, 'marina', 'lateral', 'on', ['rotate']);

    shape(paper, 50, 50, 250, 700, 'marina', 'off', 'off');
}

function master_bathroom() {
    var paper = create_canvas("master_bathroom_canvas"); 

    shape(paper, 350, 50, 100, 350, 'master bathroom', 'toilet', 'on', ['rotate']);
    shape(paper, 350, 400, 100, 350, 'master bathroom', 'sink', 'on', ['rotate']);
    shape(paper, 450, 50, 300, 150, 'master bathroom', 'shower', 'on');
    shape(paper, 450, 200, 300, 550, 'master bathroom', 'center', 'on');
    shape(paper, 750, 50, 100, 700, 'master bathroom', 'bath', 'on', ['rotate']);
    
    shape(paper, 50, 50, 250, 700, 'master bathroom', 'off', 'off');
}

function master_bedroom() {
    var paper = create_canvas("master_bedroom_canvas");

    shape(paper, 350, 50, 100, 700, 'master bedroom', 'lateral', 'on', ['rotate']);
    shape(paper, 450, 50, 400, 150, 'master bedroom', 'door-side', 'on');
    shape(paper, 450, 200, 400, 400, 'master bedroom', 'center', 'on');
    shape(paper, 450, 600, 400, 150, 'master bedroom', 'window-side', 'on');

    shape(paper, 50, 50, 250, 700, 'master bedroom', 'off', 'off');
}

function outside() {
    var paper = create_canvas("outside_canvas"); 

    shape(paper, 750, 50, 100, 325, 'outside', 'counter', 'on', ['rotate']);
    shape(paper, 350, 50, 400, 325, 'outside', 'main', 'on');

    shape(paper, 350, 425, 250, 225, 'external', 'firepit', 'on');
    shape(paper, 600, 425, 250, 225, 'external', 'deck & door', 'on');
    shape(paper, 350, 650, 500, 100, 'external', 'house-front', 'on');

    shape(paper, 50, 50, 250, 325, 'outside', 'off', 'off');
    shape(paper, 50, 425, 250, 325, 'external', 'off', 'off');
}

function game_room() {
    var paper = create_canvas("game_room_canvas");

    shape(paper, 350, 50, 500, 150, 'game room', 'lateral', 'on');
    shape(paper, 350, 200, 500, 550, 'game room', 'center', 'on');

    shape(paper, 50, 50, 250, 700, 'game room', 'off', 'off');
}

function fill_tabs() {
    // TODO
    // var selected_tab = close_tabs();

    compute_dimensions();

    living_room();
    kitchen();
    enrico();
    marina();
    master_bedroom();
    master_bathroom();
    outside();
    game_room();

    // TODO
    // open_tab(selected_tab);
}

window.onorientationchange = function() { 
    fill_tabs();
};

fill_tabs();

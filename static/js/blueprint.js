window.onorientationchange = function() { 
    console.log('reload on rotate');
    window.location.reload();
};

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

var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    width = w.innerWidth || e.clientWidth || g.clientWidth,
   	height = w.innerHeight|| e.clientHeight|| g.clientHeight;

width -= 100;
height -= 100;

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

    var label = action;
    var offset = 5;

    if (on === 'on' && options.includes('dimmer')) {
        rect.drag(function(dx, dy, _, _, e) {
                var x_percent, y_percent;
                if (e instanceof TouchEvent) {
                    x_percent = (e.touches[0].pageX - paper.canvas.getBoundingClientRect().left - x) / w;
                    y_percent = 1 - (e.touches[0].pageY - paper.canvas.getBoundingClientRect().top - y) / h;

                    x_percent = cap(x_percent, 0, 1);
                    y_percent = cap(y_percent, 0, 1);
                    
                }
                else  {
                    x_percent = (e.offsetX - x) / w;
                    y_percent = (e.offsetY - y) / h;

                    x_percent = cap(x_percent, 0, 1);
                    y_percent = cap(y_percent, 0, 1);
                    
                }

                if (w * 1.0 / h < 1.5) {
                    rect.attr('fill', interpolate_color(y_percent));
                }
                else {
                    rect.attr('fill', interpolate_color(x_percent));
                }

                rect.x_percent = x_percent;
                rect.y_percent = y_percent;

            }, undefined,
            // on end
            function() {
                if (rect.x_percent === '' && rect.y_percent === '') {
                    rect.attr('fill', interpolate_color(1));
                    light(area, action);
                }
                else {
                    if (w * 1.0 / h < 1.5)  { 
                        dimmer(area, action, ~~(rect.y_percent * 255));
                    }
                    else {
                        dimmer(area, action, ~~(rect.x_percent * 255));
                    }
                    rect.x_percent = ''
                    rect.y_percent = ''
                }
            });
    }

    rect.click(
        function() {
            light(area, action);
            if (on !== 'on') {
                room_rects = rooms[area];
                for (var i = 0; i < room_rects.length; i++) {
                    room_rects[i].attr('fill', interpolate_color(0));
                }
            }
            else {
                rect.attr('fill', '#afa');
                rect.x_percent = ''
                rect.y_percent = ''
            }
        });

    // Label
    setTimeout(function(){
        // Some weird bug in Raphael has the y-height doubled
        rect.text = paper.text(x + w/2, (y + h / 2)/2 + offset, label); 
        rect.text.click(function() {light(area, action)});
        rect.text.attr(text_style);
        if (options.includes('rotate')) {
            rect.text.rotate(90, x + w/2, (y + h / 2));
        }
            
    });
}

function kitchen() {
    var div = document.getElementById("kitchen_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px';

    shape(paper, 350, 50, 100, 700, 'kitchen', 'lateral', 'on', ['rotate']);
    shape(paper, 450, 50, 400, 150, 'kitchen', 'sink', 'on');
    shape(paper, 450, 200, 400, 400, 'kitchen', 'island', 'on');
    shape(paper, 450, 600, 400, 150, 'kitchen', 'center', 'on');

    shape(paper, 50, 50, 250, 700, 'kitchen', 'off', 'off');
}

function living_room() {
    var div = document.getElementById("living_room_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 350, 50, 400, 550, 'living room', 'center', 'on', ['dimmer']);
    shape(paper, 750, 50, 100, 550, 'living room', 'inner lateral', 'on', ['rotate', 'dimmer']);
    shape(paper, 350, 600, 500, 150, 'living room', 'outer lateral', 'on', ['dimmer']);

    shape(paper, 50, 50, 250, 700, 'living room', 'off', 'off');

    // Sliders

}

function enrico() {
    var div = document.getElementById("enrico_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 350, 50, 500, 150, 'enrico', 'window', 'on');
    shape(paper, 350, 200, 500, 550, 'enrico', 'center', 'on');

    shape(paper, 50, 50, 250, 700, 'enrico', 'off', 'off');
}

function marina() {
    var div = document.getElementById("marina_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 350, 50, 100, 700, 'marina', 'bed', 'on', ['rotate']);
    shape(paper, 450, 50, 300, 700, 'marina', 'center', 'on');
    shape(paper, 750, 50, 100, 700, 'marina', 'lateral', 'on', ['rotate']);

    shape(paper, 50, 50, 250, 700, 'marina', 'off', 'off');
}

function master_bathroom() {
    var div = document.getElementById("master_bathroom_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 350, 50, 100, 350, 'master bathroom', 'toilet', 'on', ['rotate']);
    shape(paper, 350, 400, 100, 350, 'master bathroom', 'sink', 'on', ['rotate']);
    shape(paper, 450, 50, 300, 150, 'master bathroom', 'shower', 'on');
    shape(paper, 450, 200, 300, 550, 'master bathroom', 'center', 'on');
    shape(paper, 750, 50, 100, 700, 'master bathroom', 'bath', 'on', ['rotate']);
    
    shape(paper, 50, 50, 250, 700, 'master bathroom', 'off', 'off');
}

function master_bedroom() {
    var div = document.getElementById("master_bedroom_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 350, 50, 100, 700, 'master bedroom', 'lateral', 'on', ['rotate']);
    shape(paper, 450, 50, 400, 150, 'master bedroom', 'door-side', 'on');
    shape(paper, 450, 200, 400, 400, 'master bedroom', 'center', 'on');
    shape(paper, 450, 600, 400, 150, 'master bedroom', 'window-side', 'on');

    shape(paper, 50, 50, 250, 700, 'master bedroom', 'off', 'off');
}

function outside() {
    var div = document.getElementById("outside_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 750, 50, 100, 325, 'outside', 'counter', 'on', ['rotate']);
    shape(paper, 350, 50, 400, 325, 'outside', 'main', 'on');

    shape(paper, 350, 425, 250, 225, 'external', 'firepit', 'on');
    shape(paper, 600, 425, 250, 225, 'external', 'deck & door', 'on');
    shape(paper, 350, 650, 500, 100, 'external', 'house-front', 'on');

    shape(paper, 50, 50, 250, 325, 'outside', 'off', 'off');
    shape(paper, 50, 425, 250, 325, 'external', 'off', 'off');
}

function game_room() {
    var div = document.getElementById("game_room_canvas");
    var paper = new Raphael(div, width, height);
    div.style.width = width + 'px'

    shape(paper, 350, 50, 500, 150, 'game room', 'lateral', 'on');
    shape(paper, 350, 200, 500, 550, 'game room', 'center', 'on');

    shape(paper, 50, 50, 250, 700, 'game room', 'off', 'off');
}

living_room();
kitchen();
enrico();
marina();
master_bedroom();
master_bathroom();
outside();
game_room();


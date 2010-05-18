var PI = Math.PI;
var PI_2 = PI/2;
var RAD = PI / 180;

var DRAW_GUTTER = 100;
var DRAW_GUTTER_2 = DRAW_GUTTER * 2;
var WINDOW_HEIGHT = 512;
var WINDOW_WIDTH = 512;
var WINDOW_LEFT = -WINDOW_WIDTH/2 - DRAW_GUTTER;
var WINDOW_TOP = -WINDOW_HEIGHT/2 - DRAW_GUTTER;
var WINDOW_RIGHT = WINDOW_WIDTH/2 + DRAW_GUTTER;
var WINDOW_BOTTOM = WINDOW_HEIGHT/2 + DRAW_GUTTER;
var BOARD_HEIGHT = 1024;
var BOARD_WIDTH = 1024;
var MIN = [-512,-512];
var MAX = [512,512];

function wrap(n, min, max) {
	var span = max - min;
	if (n<min) {
		return n + span;
	} else if (n > max) {
		return n - span;
	} else {
		return n;
	}
}

var tbl = [[-BOARD_WIDTH,-BOARD_HEIGHT],
	[0,-BOARD_HEIGHT],
	[BOARD_WIDTH,-BOARD_HEIGHT],	
  	[-BOARD_WIDTH,0],
	[0,0],
	[BOARD_WIDTH,0],
	[-BOARD_WIDTH,BOARD_HEIGHT],
	[0,BOARD_HEIGHT],
	[BOARD_WIDTH, BOARD_HEIGHT]];

function dot(a,b) {
	return a.x*b.x + a.y*b.y;
}
function cross(a, b) {
	return a.x*b.y - b.x*a.y;
}

var epsilon = 10e-6;
function intersect(A,B,C,D) {
	p = A;
	r = B.sub(A);
	q = C;
	s = D.sub(C);
	rCrossS = cross(r, s);
	if(rCrossS <= epsilon && rCrossS >= -1 * epsilon){
		return false;
	}
	t = cross(q.sub(p), s)/rCrossS;
	u = cross(q.sub(p), r)/rCrossS;
	if(0 <= u && u <= 1 && 0 <= t && t <= 1){
		return true;
	}else{
		return false;
	}
}

function inTriangle(A,B,C,P) {
	// Compute vectors        
	var v0 = C.sub(A);
	var v1 = B.sub(A);
	var v2 = P.sub(A);

	// Compute dot products
	var dot00 = dot(v0, v0);
	var dot01 = dot(v0, v1);
	var dot02 = dot(v0, v2);
	var dot11 = dot(v1, v1);
	var dot12 = dot(v1, v2);

	// Compute barycentric coordinates
	var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
	var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
	var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

	// Check if point is in triangle
	return (u >= 0) && (v >= 0) && (u + v <= 1);
}


function Point(_x,_y,_rad) {
	if (!_rad) {
		this.x = _x;
		this.y = _y;
	} else {
		this.q = _x;
		this.r = _y;
		this.x = Math.sin(this.q * RAD) * this.r;
		this.y = Math.cos(this.q * RAD) * this.r;
	}
}
Point.prototype = {
	add : function (_p) {
		return new Point(this.x+_p.x,this.y+_p.y);
	},
	_add : function (_p) {
		var res = this.add(_p);
		this.x = res.x;
		this.y = res.y;
	},
	sub : function (_p) {
		return new Point(this.x-_p.x,this.y-_p.y);
	},
	toVector: function() {
		return [this.x,this.y];
	},
	toPolar: function() {
		return {
			q : Math.atan2(this.y, this.x) / RAD - 90,
			r : Math.sqrt(this.x*this.x + this.y*this.y)
		};
	}
};

function RadPoly(_a) {
	this.pts = [];
	for (var i=0; i<_a.length; i++) {
		var p = _a[i];
		this.pts.push(new Point(p[0], p[1], true));
	}
}
RadPoly.prototype = {
	draw : function(_ctx, _o) {
		_ctx.save();
		_ctx.translate(_o.x,_o.y);
		_ctx.beginPath();
		var p = this.pts;
		_ctx.moveTo(p[0].x, p[0].y);
		for (var i=0; i<p.length; i++) {
			j = p[i]
			_ctx.lineTo(j.x,j.y);
		}
		_ctx.lineTo(p[0].x, p[0].y);
		_ctx.stroke();
		_ctx.restore();
	},
	bounds: function(_o) {
		var p = this.pts;
		var o = new Point(0,0);
		for (var i=0; i<p.length; i++) {
			if (inTriangle(o,p[i],p[(i+1)%p.length],_o)) {
				return true;
			}
		}
		return false;
	}
};

function Bullet(_o,_v) {
	this.pos = new Point(_o.x, _o.y);
	this.vel = new Point(_v.x, _v.y);
	this.life = 100;
}
Bullet.prototype = {
	draw : function(_ctx) {
		for (var i in [0,1,2,3,4,5,6,7,8]) {
			if (this.pos.x+tbl[i][0] + pos.x > WINDOW_LEFT &&
				this.pos.x+tbl[i][0] + pos.x < WINDOW_RIGHT &&
				this.pos.y+tbl[i][1] + pos.y > WINDOW_TOP &&
				this.pos.y+tbl[i][1] + pos.y < WINDOW_BOTTOM
			){
				_ctx.save();
				_ctx.translate(tbl[i][0],tbl[i][1]);
				_ctx.beginPath();
				_ctx.moveTo(this.pos.x, this.pos.y);
				var np = this.pos.add(this.vel);
				_ctx.lineTo(np.x, np.y);
				_ctx.stroke();
				_ctx.restore();
				return;
			}
		}
	},
	tick : function() {
		this.pos._add(this.vel);
		this.pos.x = wrap(this.pos.x, MIN[0], MAX[0]);
		this.pos.y = wrap(this.pos.y, MIN[1], MAX[1]);
		this.life--;
	},
	hits : function(_rp, _p, _q) {

		var p1 = this.pos.sub(_p).toPolar();
		p1 = new Point(p1.q+_q,p1.r,true);		
		var p2 = this.pos.add(this.vel);
		p2 = p2.sub(_p).toPolar();
		p2 = new Point(p2.q+_q,p2.r,true);		
		
		if (_rp.bounds(p1) || _rp.bounds(p2)) {
			return true;
		}
		var pts = _rp.pts;
		var len = pts.length;
		for (var i=0; i<pts.length; i++) {
			if (intersect(pts[i], pts[(i+1) % len], p1, p2)) {
				return true;
			}		
		}
		return false;
	}
};

function Asteroid(_o,_v,_r,_q) {
	this.pos = _o;
	this.vel = _v;
	this.ang = 0;
	this.r = _r;
	this.rot = (_q != undefined) ? _q : 1;
	var arr = [];
	for (var i=0; i<18; i++) {
		arr.push([Math.random()*_r/2 + i*20, Math.random() * _r/2 + _r]);
	}
	this.poly = new RadPoly(arr);
}
Asteroid.prototype = {
	draw : function(_ctx) {
		for (var i in [0,1,2,3,4,5,6,7,8]) {
			if (this.pos.x+tbl[i][0] + pos.x > WINDOW_LEFT &&
				this.pos.x+tbl[i][0] + pos.x < WINDOW_RIGHT &&
				this.pos.y+tbl[i][1] + pos.y > WINDOW_TOP &&
				this.pos.y+tbl[i][1] + pos.y < WINDOW_BOTTOM
			){
				_ctx.save();
				_ctx.translate(this.pos.x+tbl[i][0],this.pos.y+tbl[i][1]);
				_ctx.rotate(this.ang*RAD);
				this.poly.draw(_ctx,new Point(0,0));
				_ctx.restore();
				return;
			}
		}
	},
	tick : function() {
		this.ang += this.rot;
		this.ang %= 360;
		this.pos._add(this.vel);
		this.pos.x = wrap(this.pos.x, MIN[0], MAX[0]);
		this.pos.y = wrap(this.pos.y, MIN[1], MAX[1]);
		
	},
	bounds: function(_p) {
		var p = _p.add(this.pos).toPolar();
		p = new Point(p.q-this.ang,p.r,true);
		return this.poly.bounds(p);
	}
}

var field = [];

for (var i=0; i<4; i++) {
	field.push(new Asteroid(
		new Point(Math.random() * BOARD_WIDTH - BOARD_WIDTH/2, Math.random() * BOARD_HEIGHT - BOARD_HEIGHT/2),
		new Point(Math.random() * 3 - 2, Math.random() * 3 - 2),
		60));
}

function split(n) {
	var orig = field.splice(n,1)[0];
	var op = orig.pos;
	var ov = orig.vel;
	var nr = orig.r/2;
	field.push(new Asteroid(op.add(new Point(-nr,-nr)),
		ov.add(new Point(Math.random() * -1, Math.random() * -1)),
		nr));
	field.push(new Asteroid(op.add(new Point(nr,-nr)),
		ov.add(new Point(Math.random() * 1, Math.random() * -1)),
		nr));
	field.push(new Asteroid(op.add(new Point(-nr,nr)),
		ov.add(new Point(Math.random() * -1, Math.random() * 1)),
		nr));
	field.push(new Asteroid(op.add(new Point(nr,nr)),
		ov.add(new Point(Math.random() * 1, Math.random() * 1)),
		nr));
	
}

function cleanUp() {
	for (i in splitAsteroidStack) {
		if (splitAsteroidStack[i]) {
			split(i);
		}
		deadAsteroidStack[i] = true;
	}
	for (i in deadAsteroidStack) {
		if (deadAsteroidStack[i]) {
			field[i] = false;
		}
	}
}

function fire() {
	var nb = new Bullet(
		(new Point(-angle, 11, true)).sub(pos),
		(new Point(-angle, 10 + force.toPolar().r, true))
		);
	shots.push(nb);
}

var layerEls = document.getElementsByClassName("layer");
var layer = [];
var thrust = {l:0,r:0,f:0};
var force = new Point(0,0);
var pos = new Point(0,0);
var angle = 0;
var hits = 0;
for (var i=0; i<layerEls.length; i++) {
	layer.push(layerEls[i].getContext("2d"));
}

var shots = [];

layer[1].strokeStyle = "#3f3";
layer[1].font = "12pt Helvetica";
layer[1].fillStyle= "#fff";
layer[1].save();


layer[0].strokeStyle = "#fff";
layer[0].lineWidth = 2;
layer[0].translate(256,256);
layer[0].scale(-1,1);
layer[0].rotate(PI);
layer[0].save();

var player = new RadPoly([
	[0,10],
	[150,10],
	[180,6],
	[210,10]
]);

var flames = new RadPoly([
	[0,-6],
	[170,12],
	[175,10],
	[180,14],
	[185,10],
	[190,12]
]);

window.onkeydown = function(e) {
	switch (e.keyCode) {
		case 37: //left
			thrust.l = 1;
		break;
		case 39: //right
			thrust.r = 1;
		break;
		case 38: //up
			thrust.f = 1;
		break;
		case 32: //space
			fire();
		break;
	}
}
window.onkeyup = function(e) {
	switch (e.keyCode) {
		case 37: //left
			thrust.l = 0;
		break;
		case 39: //right
			thrust.r = 0;
		break;
		case 38: //up
			thrust.f = 0;
		break;
		case 40: //down
			force = new Point(0,0);
		break;
 	}
}
setInterval(function () {
	angle += (thrust.l - thrust.r) * 5;
	angle = (angle < 0 ? angle + 360 : angle) % 360;
	force.x += Math.sin(angle * RAD) * thrust.f/10;
	force.y -= Math.cos(angle * RAD) * thrust.f/10;
	pos.x += force.x;
	pos.y += force.y;
	pos.x = wrap(pos.x, MIN[0], MAX[0]);
	pos.y = wrap(pos.y, MIN[1], MAX[1]);
	
	deadAsteroidStack = [];
	splitAsteroidStack = [];
	
	layer[0].clearRect(WINDOW_LEFT,WINDOW_TOP,WINDOW_WIDTH+DRAW_GUTTER_2,WINDOW_HEIGHT+DRAW_GUTTER_2);
	layer[1].clearRect(0,0,512,512);
	
	layer[0].save();

	if (thrust.f) {
		layer[0].strokeStyle="#fc8";
		flames.draw(layer[0], new Point(0,0));
		layer[0].strokeStyle="#fff";
	}
	player.draw(layer[0], new Point(0,0));

	layer[0].rotate(-angle * RAD);
	layer[0].translate(pos.x,pos.y);

	var tests = 0;
	for (var i=0;i<shots.length;i++) {
		var a = shots[i];
		a.tick();
		a.draw(layer[0]);
		if (a.pos.add(pos).toPolar().r < 30) {
			tests++;
			if (a.hits(player, new Point(-pos.x,-pos.y), -angle)) {
				shots.splice(i,1);
			}
		}
		if (a.life < 0) {
			shots.splice(i,1);
		}
	}
	
	for (var i=0;i<field.length;i++) {
		var a = field[i];
		if (a === false) {
			field.splice(i,1);
		} else {
			a.tick();
			var l1 = a.pos.add(pos);
			var l2 = l1.toPolar();
			if (l2.r < a.r + 20) {
				var hit = false;
				for (var j=0; j<player.pts.length; j++) {
					var p = player.pts[j];
					var thishit = a.bounds(pos.sub(new Point(p.q-angle,p.r,true)));
					hit = hit || thishit;
					if (thishit) {
					 	break;
					}
				}
				if (hit && a.r > 20) {
					splitAsteroidStack[i] = true;
				}
			}
			var tr = a.r+10;
			for (var j=0;j<shots.length;j++) {
				var b = shots[j];
				var hit = false;
				if (b.pos.sub(a.pos).toPolar().r < tr) {
					tests++;
					var thishit = b.hits(a.poly, a.pos, a.ang);
					hit = hit || thishit;
					if (thishit) {
						shots.splice(j,1);
					}
				}
				if (hit) {
					if (a.r > 15) {
						splitAsteroidStack[i] = true;
					} else {
						deadAsteroidStack[i] = true;
					}
				}
			}		
		
			a.draw(layer[0]);
		}
	}
	
	cleanUp();

	layer[1].fillText(field.length + " rocks remaining",20,20);

	layer[0].restore();
	

},20);
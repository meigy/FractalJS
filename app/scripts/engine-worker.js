/*
 * The fractal engine:
 * - knows complex plane (P) and screen (S) size, coordinates and transforms
 * - handles the computation backbuffer
 * - performs fractal computations in tiles
 */
FractalJS.EngineWorker = function() {
"use strict";
	return new Worker(FractalJS.EngineWorkerBlob);
};

// the web worker is defined as a blob, thank to
// http://stackoverflow.com/questions/5408406/web-workers-without-a-separate-javascript-file
FractalJS.EngineWorkerBlob = (function() {
"use strict";
var blobURL = URL.createObjectURL( new Blob([ '(',
function(){

//-------- start of actual worker code
var engine = (function() {

//-------- private members

var escape = 4;	// square of escape distance
var fractalFunction;	// the fractal function used

//-------- private methds

var iLog2 = 1.0 / Math.log(2.0);
var iLog3 = 1.0 / Math.log(3.0);

// core fractal functions
var fractalFunctionListSmooth = {
	0 : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		if (i==iter) return i;
		for(j=0;j<4; ++j) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog2;
		return res;
	},
	// multibrot3
	1 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			znx = sqx*zx-3*zx*sqy+cx;
			zny = 3*sqx*zy-sqy*zy+cy;
			zx = znx;
			zy = zny;
			if (++i>=iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		if (i==iter) return i;
		for(j=0;j<4; ++j) {
			znx = sqx*zx-3*zx*sqy+cx;
			zny = 3*sqx*zy-sqy*zy+cy;
			zx = znx;
			zy = zny;
			sqx = zx*zx;
			sqy = zy*zy;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog3;
		return res;
	},
	// burningship
	2 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		if (i==iter) return i;
		for(j=0;j<4; ++j) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			sqx = zx*zx;
			sqy = zy*zy;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog2;
		return res;
	},
	// tippetts
	3 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zx = sqx-sqy+cx;
			zy = (zx+zx)*zy+cy;
			sqx = zx*zx;
			sqy = zy*zy;
		}
		return i;
	},
	// Julia Set A
	4 : function(cx,cy) {
		var znx=cx, zny=cy, sqx=cx*cx, sqy=cy*cy, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		if (i==iter) return i;
		for(j=0;j<4; ++j) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		var res = 5 + i - Math.log(Math.log(sqx+sqy)) * iLog2;
		return res;
	},
	// Phoenix Set
	5 : function(cx,cy) {
		var x=-cy, y=cx, xm1=0, ym1=0;
		var sx=0, sy=0, i=0;
		var c=0.5667, p=-0.5;
		for(;i<iter && sx+sy<=escape; ++i) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		if (i==iter) return i;
		for(j=0;j<4; ++j) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		var res = 5 + i - Math.log(Math.log(x*x+y*y)) * iLog2;
		return res;
	},
};

// core fractal functions
var fractalFunctionList = {
	'mandelsmooth' : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		for(j=0;j<4; ++j) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}

		var res = 5 + i - logHalfBase - Math.log(Math.log(sqx+sqy))*logBase;
		return res;
		//return i;
	},
	// mandelbrot
	0 : function(cx,cy) {
		var znx=0, zny=0, sqx=0, sqy=0, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + cy;
			znx = sqx-sqy + cx;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		return i;
	},
	// multibrot3
	1 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			znx = sqx*zx-3*zx*sqy+cx;
			zny = 3*sqx*zy-sqy*zy+cy;
			zx = znx;
			zy = zny;
			if (++i>=iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		return i;
	},
	// burningship
	2 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0, znx, zny;
		while (true) {
			zny = (zx+zx)*zy+cy;
			znx = sqx-sqy+cx;
			zx = Math.abs(znx);
			zy = Math.abs(zny);
			if (++i>=iter)
				break;
			sqx = zx*zx;
			sqy = zy*zy;
			if (sqx+sqy>escape)
				break;
		}
		return i;
	},
	// tippetts
	3 : function(cx,cy) {
		var zx=0, zy=0, sqx=0, sqy=0, i=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zx = sqx-sqy+cx;
			zy = (zx+zx)*zy+cy;
			sqx = zx*zx;
			sqy = zy*zy;
		}
		return i;
	},
	// Julia Set A
	4 : function(cx,cy) {
		var znx=cx, zny=cy, sqx=cx*cx, sqy=cy*cy, i=0, j=0;
		for(;i<iter && sqx+sqy<=escape; ++i) {
			zny = (znx+znx)*zny + 0.15;
			znx = sqx-sqy -0.79;
			sqx = znx*znx;
			sqy = zny*zny;
		}
		return i;
	},
	// Phoenix Set
	5 : function(cx,cy) {
		var x=-cy, y=cx, xm1=0, ym1=0;
		var sx=0, sy=0, i=0;
		var c=0.5667, p=-0.5;
		for(;i<iter && sx+sy<=escape; ++i) {
			xp1 = x*x-y*y+c+p*xm1;
			yp1 = 2*x*y+p*ym1;
			sx = xp1*xp1;
			sy = yp1*yp1;
			xm1=x; ym1=y;
			x=xp1; y=yp1;
		}
		return i;
	},
};

//-------- public methods

return {

drawTileOnBuffer: function(tile, model) {
	var frame = tile.frame;
	var py = model.pymin+tile.y1*model.pixelOnP;
	var dx = 0;
	for (var sy=tile.y1; sy<=tile.y2; sy++) {
		var px = model.pxmin+tile.x1*model.pixelOnP;
		for (var sx=tile.x1; sx<=tile.x2; sx++) {
			var piter = fractalFunction(px, py);
			if (piter==iter)
				frame[dx++] = 0;
			else
				frame[dx++] = piter;
			px += model.pixelOnP;
		}
		py += model.pixelOnP;
	}
},

drawSuperTileOnBuffer: function(tile, model) {
	var sss = model.pixelOnP/4;
	var frame = tile.frame;
	var py = model.pymin+tile.y1*model.pixelOnP;
	var dx = 0;
	for (var sy=tile.y1; sy<=tile.y2; sy++) {
		var px = model.pxmin+tile.x1*model.pixelOnP;
		for (var sx=tile.x1; sx<=tile.x2; sx++) {
			var itersum = 0;
			for (var ss=0; ss<16; ss++) {
				itersum += fractalFunction(px+(ss/4*sss), py+(ss%4*sss));
			}
			var piter = itersum/16;
			frame[dx++] = piter==iter?0:piter;
			px += model.pixelOnP;
		}
		py += model.pixelOnP;
	}
},

drawSubTileOnBuffer: function(tile, model) {
	var res=4;
	var py = model.pymin+(tile.y1+res/2)*model.pixelOnP;
	var index = 0;
	for (var y=0; y<tile.height; y+=res) {
		var px = model.pxmin+(tile.x1+res/2)*model.pixelOnP;
		var lineindex = index;
		for (var x=0; x<tile.width; x+=res) {
			var piter = fractalFunction(px, py);
			var color = piter==iter?0:piter;
			for (var sx=0; sx<res && x+sx<tile.width; sx++)
				tile.frame[index++] = color;
			px += model.pixelOnP*res;
		}
		for (var sy=1; sy<res && y+sy<tile.height; sy++)
			for (var tx=0; tx<tile.width; tx++)
				tile.frame[index++] = tile.frame[lineindex+tx];
		py += model.pixelOnP*res;
	}
},

setModel: function(model) {
	pxmin = model.pxmin;
	pymin = model.pymin;
	pixelOnP = model.pixelOnP;
	iter = model.iter;
	if (model.smooth)
		fractalFunction = fractalFunctionListSmooth[model.typeId];
	else
		fractalFunction = fractalFunctionList[model.typeId];
}

};

//-------- constructor
})({});

onmessage = function(param) {
	var data = param.data;
	if (!data)
		console.error(param);
	if (data.action === "draw") {
		engine.setModel(data.model);
		//console.log("receive DRAW", param)
		if (data.quality==200) engine.drawTileOnBuffer(data.tile, data.model);
		else if (data.quality==100) engine.drawSubTileOnBuffer(data.tile, data.model);
		else if (data.quality==300) engine.drawSuperTileOnBuffer(data.tile, data.model);
		else throw "invalid drawing quality";
		//setTimeout(function() {
		postMessage({
			action:"endTile",
			quality:data.quality,
			tile:param.data.tile,
			frameId:param.data.frameId,
			finished:param.data.finished
		});
	} else {
		throw "invalid worker message";
	}
};
//-------- end of actual worker code

}.toString(),
')()' ], { type: 'application/javascript' } ) );
return blobURL;
})();

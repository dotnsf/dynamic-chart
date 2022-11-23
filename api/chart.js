//. chart.js
var express = require( 'express' ),
    //Chart = require( 'chart.js/auto' ),
    { createCanvas, loadImage } = require( 'canvas' ),
    api = express();

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';

api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

api.use( express.Router() );

api.pie = function( data, colors, width, height ){
  return new Promise( async function( resolve, reject ){
    try{
      var canvas = createCanvas( width, height );
      var ctx = canvas.getContext( '2d' );

      var x = width / 2;
      var y = height / 2;
      var r = Math.floor( ( width < height ? width : height ) / 2 * 0.8 );

      var len = data.length;
      var diff = Math.PI / 2;
      var ratios = [];
      var sum = 0;
      for( var i = 0; i < len; i ++ ){
        sum += data[i];
      }
      for( var i = 0; i < len; i ++ ){
        ratios.push( data[i] / sum );
      }
      for( var i = 1; i < len; i ++ ){
        ratios[i] += ratios[i-1];
      }
      var radians = [];
      for( var i = 0; i < len; i ++ ){
        radians.push( 2 * Math.PI * ratios[i] );
      }

      ctx.strokeStyle = colors[0];
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc( x, y, r, 0 - diff, radians[0] - diff );
      ctx.lineTo( x, y );
      ctx.fill();
      for( var i = 1; i < len; i ++ ){
        ctx.strokeStyle = colors[i];
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc( x, y, r, radians[i-1] - diff, radians[i] - diff );
        ctx.lineTo( x, y );
        ctx.fill();
      }

      canvas.toBuffer( function( err, buffer ){
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, buffer: buffer } );
        }
      });
    }catch( e ){
      resolve( { status: false, error: e } );
    }
  });
};

api.cylinder = function( data, bordercolors, fillcolors, max, min, width, height ){
  return new Promise( async function( resolve, reject ){
    try{
      var canvas = createCanvas( width, height );
      var ctx = canvas.getContext( '2d' );

      var _min = Math.floor( height * 0.1 );
      var _max = Math.floor( height * 0.9 );
      var _zero = 0.0;
      var _one = 0.0;

      if( min == max ){
        //. 指定なし
        if( data.length == 1 ){
          min = ( 0 < data[0] ? 0 : data[0] );
          max = ( 0 < data[0] ? data[0] : 0 );
        }else{
          min = ( data[0] < data[1] ? data[0] : data[1] );
          max = ( data[0] < data[1] ? data[1] : data[0] );
        }
      }
      
      if( min == 0 ){
        _one = ( height * 0.8 ) / max;
        _zero = Math.floor( height * 0.9 );
      }else if( max == 0 ){
        _one = ( height * -0.8 ) / min;
        _zero = Math.floor( height * 0.1 );
      }else{
        //. 例えば min = -50, max = 100 の時、0 はどこ？
        _one = ( height * 0.8 ) / ( max - min );
        //_zero = Math.floor( ( height * 0.9 ) + _one * min );
        _zero = Math.floor( ( height * 0.9 ) + _one * min );
      }

      var x1 = Math.floor( width * 0.2 );
      var x2 = Math.floor( width * 0.8 );
      var ry = Math.floor( height * 0.05 );

      if( data.length == 1 ){
        //. 実線で円柱を描画
        var y1, y2;
        if( data[0] < 0 ){
          y2 = _zero - Math.floor( _one * data[0] );
          y1 = _zero;
        }else{
          y2 = _zero;
          y1 = _zero - Math.floor( _one * data[0] );
        }
        //. x1 < x2 && y1 < y2 の条件で円柱を描画
        drawCylinder( ctx, x1, x2, y1, y2, ry, bordercolors[0], fillcolors[0], false );
      }else if( data.length == 2 ){
        //. １つ目を破線で、２つ目を実線で円柱を描画
        var y1, y2;
        if( data[0] < 0 ){
          y2 = _zero - Math.floor( _one * data[0] );
          y1 = _zero;
        }else{
          y2 = _zero;
          y1 = _zero - Math.floor( _one * data[0] );
        }
        drawCylinder( ctx, x1, x2, y1, y2, ry, bordercolors[0], fillcolors[0], true );

        if( data[1] < 0 ){
          y2 = _zero - one * data[1];
          y1 = _zero; 
        }else{
          y2 = _zero;
          y1 = _zero - _one * data[1];
        }
        drawCylinder( ctx, x1, x2, y1, y2, ry, bordercolors[1], fillcolors[1], false );
      }

      canvas.toBuffer( function( err, buffer ){
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, buffer: buffer } );
        }
      });
    }catch( e ){
      resolve( { status: false, error: e } );
    }
  });
};

function drawCylinder( ctx, x1, x2, y1, y2, ry, borderColor, fillColor, dashed ){
  try{
    var x = Math.floor( ( x2 + x1 ) / 2 );
    var rx = x - x1;
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = fillColor;

    //. 1
    ctx.beginPath();
    if( dashed ){
      ctx.setLineDash( [5,15] );
    }else{
      ctx.setLineDash( [] );
    }
    ctx.ellipse( x, y2, rx, ry, 0, 0, 2 * Math.PI );
    if( !dashed ){
      ctx.fill();
    }
    ctx.stroke();

    //. 2
    ctx.strokeStyle = fillColor;
    ctx.beginPath();
    if( dashed ){
      ctx.strokeRect( x1, y1, 2 * rx, y2 - y1 );
    }else{
      ctx.fillRect( x1, y1, 2 * rx, y2 - y1 );
    }

    //. 3
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo( x1, y1 );
    ctx.lineTo( x1, y2 );
    ctx.moveTo( x1 + 2 * rx, y1 );
    ctx.lineTo( x1 + 2 * rx, y2 );
    ctx.stroke();

    //. 4
    ctx.beginPath();
    if( dashed ){
      ctx.setLineDash( [5,15] );
    }else{
      ctx.setLineDash( [] );
    }
    ctx.ellipse( x, y1, rx, ry, 0, 0, 2 * Math.PI );
    if( !dashed ){
      ctx.fill();
    }
    ctx.stroke();
  }catch( e ){
    console.log( { e } );
  }
}

api.get( '/pie', async function( req, res ){
  var width = req.query.width ? req.query.width : '200';
  var height = req.query.height ? req.query.height : '200';
  var colors = req.query.colors ? req.query.colors : '["#8f8","#ff8"]';
  var data = req.query.data ? req.query.data : '[80,20]';

  if( width && typeof width == 'string' ){ width = parseInt( width ); }
  if( height && typeof height == 'string' ){ height = parseInt( height ); }
  if( colors && typeof colors == 'string' ){ colors = JSON.parse( colors ); }
  if( data && typeof data == 'string' ){ data = JSON.parse( data ); }
  api.pie( data, colors, width, height ).then( function( result ){
    if( result.status ){
      res.contentType( 'image/png' );
      res.write( result.buffer );
      res.end();
    }else{
      res.contentType( 'application/json; charset=utf-8' );
      res.status( 400 );
      res.write( JSON.stringify( result.error, null, 2 ) );
      res.end();
    }
  });
});

api.get( '/cylinder', async function( req, res ){
  var width = req.query.width ? req.query.width : '200';
  var height = req.query.height ? req.query.height : '200';
  var max = req.query.max ? req.query.max : '0';
  var min = req.query.min ? req.query.min : '0';
  var bordercolors = req.query.bordercolors ? req.query.bordercolors : '["#f00","#0f0"]';
  var fillcolors = req.query.bordercolors ? req.query.bordercolors : '["#f88","#8f8"]';
  var data = req.query.data ? req.query.data : '[-50,100]';

  if( width && typeof width == 'string' ){ width = parseInt( width ); }
  if( height && typeof height == 'string' ){ height = parseInt( height ); }
  if( max && typeof max == 'string' ){ max = parseInt( max ); }
  if( min && typeof min == 'string' ){ min = parseInt( min ); }
  if( bordercolors && typeof bordercolors == 'string' ){ bordercolors = JSON.parse( bordercolors ); }
  if( fillcolors && typeof fillcolors == 'string' ){ fillcolors = JSON.parse( fillcolors ); }
  if( data && typeof data == 'string' ){ data = JSON.parse( data ); }
  api.cylinder( data, bordercolors, fillcolors, max, min, width, height ).then( function( result ){
    if( result.status ){
      res.contentType( 'image/png' );
      res.write( result.buffer );
      res.end();
    }else{
      res.contentType( 'application/json; charset=utf-8' );
      res.status( 400 );
      res.write( JSON.stringify( result.error, null, 2 ) );
      res.end();
    }
  });
});

//. api をエクスポート
module.exports = api;

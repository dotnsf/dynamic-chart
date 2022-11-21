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

//. api をエクスポート
module.exports = api;

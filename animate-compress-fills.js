/*!
 * Animate Compress Fills, http://tpkn.me/
 */

const fs = require('fs');
const lodash = require('lodash');
const UglifyJs = require('uglify-js');

function getStringSize(str){
   return Buffer.byteLength('' + str, 'utf8');
}

function AnimateCompressFills(input_file, output_file, uglify = false){
   return new Promise((resolve, reject) => {

      // Colors '.f("#FFFFFF")' and fills '.p("AglAzIAAhkIBLAAIAAAVIgwAAIAABPg")'
      let fills_rule = /\.(p|f)\((['"](.+?)['"])\)/g;
      let fills_list = [];
      let var_prefix = '_';
      let vars_list_str = '', temp_obj, size_source, size_compressed, size_uglified = 0;

      fs.readFile(input_file, 'utf8', (err, data) => {
         if(err) return reject({status: 'fail', message: 'Can\'t read file', input_file: input_file, output_file: output_file});

         size_source = getStringSize(data);
         
         while((temp_obj = fills_rule.exec(data)) !== null){
            fills_list.push(temp_obj[3]);
         }

         // Remove clones
         fills_list = lodash.uniq(fills_list);

         // var _1="gKQgKgLAAgOI",_2="A9pGkQgOAA";
         for(let i = 0, len = fills_list.length; i < len; i++){
            vars_list_str += (i == 0 ? 'var ' : ',') + (var_prefix + i) + '="' + fills_list[i] + '"';
            data = data.replace(new RegExp('[\'"]' + fills_list[i].replace(/[\+\=\/]/g, "\\$&") + '[\'"]', 'g'), var_prefix + i);
         }

         data = vars_list_str + ';\n' + data;

         size_compressed = getStringSize(data);

         if(uglify){
            data = UglifyJs.minify(data).code;
            size_uglified = getStringSize(data);
         }

         if(size_source > size_compressed || (uglify && size_source > size_uglified)){
            if(typeof output_file !== 'string'){
               resolve({status: 'ok', message: 'Fills are compressed', input_file: input_file, output_file: output_file, js_content: data, size: {source: size_source, compressed: size_compressed, uglified: size_uglified}});
            }else{
               fs.writeFile(output_file, data, 'utf8', err => {
                  if(err) return reject({status: 'fail', message: 'Can\'t write file', input_file: input_file, output_file: output_file});
                  
                  resolve({status: 'ok', message: 'Fills are compressed', input_file: input_file, output_file: output_file, js_content: data, size: {source: size_source, compressed: size_compressed, uglified: size_uglified}});
               });
            }
         }else{
            resolve({status: 'skip', message: 'Nothing to compress', input_file: input_file, output_file: output_file, js_content: data, size: {source: size_source, compressed: size_compressed, uglified: size_uglified}});
         }
      });
   });
}

module.exports = AnimateCompressFills;

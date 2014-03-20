var nature = (function(){

	function resolveInheritance(parents){

		//empty baseline (no parents)
		var definitions = [];

		//recursively resolve inheratance
		recursiveInheretance(parents, definitions);

		return definitions;
	}

	function recursiveInheretance(parents, definitions){

		var iMax = parents.length, def, i;
		for(i=0; i<iMax; i++){
			def = parents[i];
			if(!def["nature:definition"]){
				//ingore previously resolved dependencies
				if(definitions.indexOf(def)===-1){
					definitions.push(def);
				}
			} else {
				recursiveInheretance(def["nature:definition"], definitions);
			}

		}
	}

	function createClass(args, keys){

		var definitions = resolveInheritance(args);

		var unfold, packageKey;

		if (keys){
			unfold = function(obj){
				if(!obj['nature:protected']) throw new Error("Nature.js: Object package not found.");
				return obj['nature:protected'](keys);
			}

			packageKey = keys[keys.length-1];
		}

		var Class = function(){

			var priv = {}, pub = this, i=definitions.length;

			//create from definitions
			while(i--){
				definitions[i](pub, priv, unfold);
			}

			//initialise constructor if it exists
			if(typeof priv.construct == "function"){
				priv.construct.apply(priv, arguments);
			}

			if(packageKey){
				this['nature:protected'] = function(keys){
					if(packageKey && keys && keys.indexOf(packageKey)!==-1){
						return priv;
					} else {
						throw new Error("Nature.js: Private access from out of package denied.");
					}
				}
			}

		}

		//save definitions for future inheritance dependencies
		Object.defineProperty(Class, "nature:definition", {
		  enumerable: false,
		  configurable: true,
		  writable: true,
		  value: args
		});

		return Class;

	}

	function createNature(keys){

		var locked = false;

		var pack = {

			createPackage : function(){

				var packageKeys = keys ? keys.slice() : [];

				packageKeys.push({});

				return createNature(packageKeys);
			},

			from : function(){
				args = [].slice.apply(arguments);
				return {
					create: function(def){
						args.push(def)
						return createClass(args, keys);
					}
				}
			},

			create: function(def){

				if(locked) throw new Error("Nature.js: cannot create class on closed package.");

				return createClass([def], keys);
			}
		}

		if(keys){
			pack.close = function(){
				locked = true;
			}
		}

		return pack;
	}

	return createNature();

})();

if(typeof module !== 'undefined' && module.exports){
	module.exports = nature;
}
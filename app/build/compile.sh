#!/bin/bash

COMPPATH="C:\Users\apohl\Downloads"
JSPATH="C:\FoundOps\ng\app\js"
GOOGPATH="C:\FoundOPS\ng\app\lib\closure-library\closure\goog"
EXTERNSPATH="C:\Users\apohl\Downloads\externs"

if [[ $1 == "whitespace" ]]
then
	optimizationlevel=WHITESPACE_ONLY
elif [[ $1 == "simple" ]]
then
	optimizationlevel=SIMPLE_OPTIMIZATIONS
elif [[ $1 == "advanced" ]]
then
	optimizationlevel=ADVANCED_OPTIMIZATIONS
else
	echo -e "\nYou must enter a correct optimization level as the first arg (white, simple, advanced)."
	exit
fi
	
echo -e "\n"
echo "Closure Compiler - Compiling with $optimizationlevel.
"

java -jar "$COMPPATH\compiler.jar" --js "C:\FoundOps\ng\app\lib\jquery\jquery.js" --js "C:\FoundOps\ng\app\lib\leaflet.js" --js "$GOOGPATH\base.js" --js "$GOOGPATH\date\utcdatetime.js" --js "$GOOGPATH\date\date.js" --js "$GOOGPATH\structs\map.js" --js "$GOOGPATH\iter\iter.js" --js "$GOOGPATH\date\datelike.js" --js "$GOOGPATH\string\string.js" --js "$GOOGPATH\asserts\asserts.js" --js "$GOOGPATH\array\array.js" --js "$GOOGPATH\structs\structs.js" --js "$GOOGPATH\object\object.js" --js "$GOOGPATH\debug\error.js" --js "$GOOGPATH\i18n\datetimesymbols.js" --js "$JSPATH\leaflet.js" --js "$JSPATH\mapController.js" --js "$JSPATH\models.js" --js "$JSPATH\services.js" --js "$JSPATH\tools.js" --js_output_file closure-compiled.js --manage_closure_dependencies --compilation_level "$optimizationlevel" --externs "$EXTERNSPATH\jquery.js"
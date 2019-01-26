import pprint
import sys
import json

if len(sys.argv) == 2:
	print(pprint.pformat(json.load(open(sys.argv[1]))))
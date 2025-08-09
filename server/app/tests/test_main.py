""" Tests for API endpoints found in main.py """

#########################
# get_puzzle_endpoint tests
#########################

# GET /api/puzzle/:date should return the puzzle with that date from the database or 404 if not found.
# EITHER if :date is not given, the endpoint should default to today's puzzle OR there's a special endpoint, /api/puzzle/today, for today's puzzle.  Either implementation makes sense to me, but choose one.
# If date is in the future, return an error (probably status 403? I think?).  I guess include a cheeky error message like, "No spoilers!"  (Or a plain descriptive error message, that's OK too.)

######################
# get_game_rules tests
######################

# GET /api/config should return the contents of game_rules.yaml in JSON form
# The eventual endpoint will use app.crud.get_game_rules to read the game rules from disk (or from memory)

####################
# get_wordlist tests
####################

# GET /api/wordlist should return the complete list of legal words
# The eventual endpoint will use app.crud.get_full_wordlist to read the list from disk (or memory)
# It's still somewhat up in the air what format this data should be.  The `config/words-full.txt` file is 300KB and over 40,000 lines, so converting from raw text to a JSON list might be a non-negligible increase in the size of the transfer?  It might be better to just send as a string and have the client split/JSONify.  (At that point, it might be _even better_ to not have this be a server endpoint at all, and just have the wordlist served as a static file by Nginx or the eventual webserver.  A lot of options here!)

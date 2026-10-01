This tool is coming along nicely, but we have a few user experience issues we want to fix.

# 1. Remove Pop Out Button
The "POP OUT" button that appears in the GM console should be removed. It does not end
up adding a lot of value and it introduces some user experience issues.

# 2. Status Linking
The Combat & Turn sheet in the GM console allows the GM to toggle states for broken, infected, and starving.
These are not fully linked to the states that are toggled in the character sheet. Please ensure those three
states are unified such that if they are toggled in one location they are toggled in all locations.
There should be a single representation for the state in each character.

# 3. GM Console Header
When the user toggles to the GM Console it still contains the header section used in the character sheet.
Specifically the section containing the name, conditions, long rest, short rest, load, save, generate buttons.
This should NOT be the case, this header should be factored only into the character sheet and perhaps brought
more in line with the styling of the rest of the sheet.

# 4. Mixed Character and Monster Tokens
Our current design effectively requires a token to have an associated character. It does this by generating a
character the moment a token is linked. Instead we should have a more sophisticated system:

1. If the user is a player, the token should simply require the attachment of a character sheet like it does currently.
2. If the user is a GM they should be able to designate a token as either a character or monster.
  2a. If the user chooses character the sheet should behave as it does today.
  2b. If the user chooses monster the sheet should allow the GM to attach a monster stat block to the token.

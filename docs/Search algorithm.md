# Search algorithm

1. Users type something into search box
2. App finds exact matches of the components of the query
   - Components are separate words of the same query separated by a space. E.g if "foo bar" is the query, the components are "foo" and "bar"
3. Notes with those exact matches are sorted based on the following criteria, listed in order of importance:
   - Number of unique matches. E.g, if a user queries for "foo bar", notes that contain exact matches for "foo" and "bar" are ranked higher than those that only contain "foo".
   - Number of matches overall
   - Time last modified

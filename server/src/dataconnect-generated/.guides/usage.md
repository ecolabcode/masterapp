# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, getNotesForCurrentUser, updateNote, deleteNote } from '@dataconnect/generated';


// Operation CreateUser: 
const { data } = await CreateUser(dataConnect);

// Operation GetNotesForCurrentUser: 
const { data } = await GetNotesForCurrentUser(dataConnect);

// Operation UpdateNote:  For variables, look at type UpdateNoteVars in ../index.d.ts
const { data } = await UpdateNote(dataConnect, updateNoteVars);

// Operation DeleteNote:  For variables, look at type DeleteNoteVars in ../index.d.ts
const { data } = await DeleteNote(dataConnect, deleteNoteVars);


```
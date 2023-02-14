// import { IDocumentStore, DocumentStore, IDocumentSession, DocumentConstructor, IRavenObject } from 'ravendb';

// export class Foo{
//     async ravenTest(){
//         let store = DocumentStore.create('http://wal-desktop:8081', 'TestDb');
        
//         const resolveConstructor = (typeName: string): DocumentConstructor => {
           
//           const classesMap: IRavenObject<DocumentConstructor> = <IRavenObject<DocumentConstructor>>require(`../../model/${typeName}`);
      
//           let foundCtor: DocumentConstructor;  
      
//           if ((typeName in classesMap) && ('function' === (typeof (foundCtor = classesMap[typeName])))) {
//             return foundCtor;
//           } 
//         };
//         store.conventions.addDocumentInfoResolver({ resolveConstructor });
//         store.initialize();
    
        // {
        //   const session = store.openSession();
        //   let user = new User();
        //   user.guid = "guid1";
        //   user.accounts.push(new Account('dash', 100));
        //   await session.store(user, 'Users/');
        //   await session.saveChanges();
        //   console.log(user.id)
        // }
      //{
        // const session = store.openSession();
        // let users: User[] = await session
        //   .query<User>({ collection: 'Users' })         
        //   .waitForNonStaleResults()
        //   .all();
        // console.log('users', users)
        // console.log(users[0] instanceof User);
      //}
    
        
//       }
// }
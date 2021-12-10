// Calling .config() will allow dotenv to pull environment variables from our .env file...
require('dotenv').config();
// ...made available from process.env
const TableName = process.env.TABLE_NAME;
// You'll need to call dynamoClient methods to envoke CRUD operations on the DynamoDB table
const dynamoClient = require('../db');
// uuid, useful for generating unique ids
const uuid = require("uuid");
const { DynamoDB } = require('aws-sdk');

module.exports = class TodoDataService {
  static async addTodo(todo) {
    const id = uuid.v4();
    todo.id = id;

    const params = {
      TableName, // "tododata"
    };

    try {
      // Check the "tododata" table for existing a tododata item
      //var documentClient = new AWS.DynamoDB.DocumentClient();
      console.log("HERE AT LINE 23")
      let existingTodoData = await dynamoClient.scan(params).promise()
      .then((data) => {
        console.log("EXISTINGTODODATA: ", data);
        return data
      })
      
      // no tododata exists yet
      if (existingTodoData.Items.length === 0) {
        const newTodoData = {
          order: [],
          todos: {}
        };
        newTodoData.id = "0";
        newTodoData.order.push(id);
        newTodoData.todos[id] = todo;
        
        // Add a new tododata placeholder item to the "tododata" table
        const params = {
          TableName,
          Item: newTodoData,
        }

       
     // Return the newly created tododata item
     await dynamoClient.put(params).promise()
       .then((data) => {
         console.log(data);
       })
    
     return await dynamoClient.scan({TableName}).promise().then((data) => {
       console.log(data.Items[0]); 
       return data.Items[0];
      })
    
      //another way to do this code using the get to get the same result of the scan
      //  return await dynamoClient.get({ 
        //      TableName,
        //      Key: {
        //       id: "0"
        //      }
        //   }).promise()
        //   .then((data) => {
        //     console.log("Latest data:", data.Item);
        //     return data.Item;
        //   }).catch((error) => {
        //     console.log(error)
        //   });

     

      } else { // a tododata item already exist
        existingTodoData = existingTodoData.Items[0];
        existingTodoData.order.push(id);
        existingTodoData.todos[id] = todo;
        
        // Replace the existing tododata item with the new one, created in the above three lines
        const params = {
          TableName,
          Item: existingTodoData,
        }
        await dynamoClient.put(params).promise()
        .then((data) => {
          console.log(data);
        })

        // Return the newly created tododata item
        
        return await dynamoClient.scan({TableName}).promise().then((data) => {
        console.log(data.Items[0]);
        return data.Items[0];
        })
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  static async getTodos() {
    try {
      
      return await dynamoClient.scan({ TableName }).promise().then((data) => {
        console.log(data.Items[0]); 
        return data.Items[0];
        })  

      // Check the "tododata" table for the tododata item, and return it
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  static async updateOrder(options) {
    try {
      const params = {
        TableName,
        Key: {
          id: "0"
        },
        // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.html
        // Setting a name to the current attribute that u want to update. In this case we want to update the 'order'
        ExpressionAttributeNames: {
          "#oldOrder": "order"
        },
        // Setting an attribute name for the new order value (options.order) with which we want to update the current attribute 'order' 
        ExpressionAttributeValues: {
          ":newOrder": options.order
        },
        // Update the current attribute with the new attribute value
        UpdateExpression: "set #oldOrder = :newOrder",
      }
      await dynamoClient.update(params).promise()

      // Update the tododata item
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // static async updateTodo(id, options) {
  //   try {
  //     let params = {
  //       TableName,
  //       Key: {
  //         id: "0"
  //       }
  //     }

  //     // Check the "tododata" table for the tododata item, and set it to "existingTodo"
  //     // let existingTodo = ...

  //     for (let key in options) {
  //       existingTodo.todos[id][key] = options[key];
  //     }

  //     params = {
  //       TableName,
  //       Item: {
  //         ...existingTodo
  //       }
  //     }

  //     // Replace the existing tododata item with the updated one
  //   } catch (error) {
  //     console.error(error);
  //     return error;
  //   }
  // }

  // static async deleteTodo(id) {
  //   try {
  //     let params = {
  //       TableName,
  //       Key: {
  //         id: "0"
  //       }
  //     }

  //     // Check the "tododata" table for the tododata item, and set it to "existingTodo"
  //     // let existingTodo = ...

  //     existingTodo.order = existingTodo.order.filter((orderId) => {
  //       return orderId !== id
  //     });

  //     delete existingTodo.todos[id];

  //     params = {
  //       TableName,
  //       Item: {
  //         ...existingTodo
  //       }
  //     }

  //     // Replace the existing tododata item with the updated one
  //   } catch (error) {
  //     console.error(error);
  //     return error;
  //   }
  // }

  // static async deleteCompletedTodos() {
  //   try {
  //     let params = {
  //       TableName,
  //       Key: {
  //         id: "0"
  //       }
  //     }

  //     let existingTodo = await dynamoClient.scan(params).promise().then((data) => {
  //         return data.Items[0];
  //     });

  //     existingTodo.order = existingTodo.order.filter((orderId) => {
  //       return !existingTodo.todos[orderId].completed;
  //     });
  //     for (let id in existingTodo.todos) {
  //       if (existingTodo.todos[id].completed) {
  //         delete existingTodo.todos[id];
  //       }
  //     }
      
  //     params = {
  //       TableName,
  //       Item: {
  //         ...existingTodo
  //       }
  //     }

  //     await dynamoClient.put(params).promise();
  //   } catch (error) {
  //     console.error(error);
  //     return error;
  //   }
  // }
};

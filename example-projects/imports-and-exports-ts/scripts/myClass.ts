
// This is a simple class that is exported with the 'export' keyword.
// Other scripts can use it by importing it with the line:
// import { MyClass } from "./myClass.js";
// Learn more about exports here:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
export class MyClass {

	message: string;
	
	constructor()
	{
		this.message = "Hello world!";
	}
	
	GetMessage()
	{
		return this.message;
	}
}
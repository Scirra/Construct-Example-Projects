
// This is a TypeScript definition file with the extension .d.ts.
// This means instead of containing code, its purpose is only to provide
// additional TypeScript definitions to the type checker. This is necessary
// when using external script or WASM modules, as otherwise TypeScript
// doesn't know anything about their type definitions.

// external.ts declares a global function 'MyExternalFunction' that
// returns a string.
declare function MyExternalFunction() : string;

// simple.wasm provides a WebAssembly export named exported_func.
// Note this interface extends WebAssembly.Exports which is the
// default type for the 'exports' property of a WebAssembly
// instance, and adds the exported_func that we know will be there.
declare interface SimpleWasmExports extends WebAssembly.Exports {
    exported_func(): void;
}

// A loaded texture of the piggy image to draw from the piggy.png project file.
let piggyTexture;

// On startup, listen for the beforeprojectstart event, and also load the piggy texture.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));

	await LoadPiggyTexture(runtime);
});

// Load the project file piggy.png as a texture ready for rendering.
async function LoadPiggyTexture(runtime)
{
	// First fetch the piggy.png file over the network, and read it as a Blob
	// (a JavaScript object representing some binary data).
	const response = await fetch("piggy.png");
	const blob = await response.blob();

	// Create an ImageBitmap from the blob, which decodes the image.
	const imageBitmap = await createImageBitmap(blob);

	// Create the texture from the ImageBitmap.
	piggyTexture = await runtime.renderer.createStaticTexture(imageBitmap);
}

// Before the project starts, get layer 0 and attach an afterdraw event.
async function OnBeforeProjectStart(runtime)
{
	const layer = runtime.layout.getLayer(0);
	layer.addEventListener("afterdraw", e => OnAfterLayerDraw(runtime, e.renderer));
}

// Handle the afterdraw event for layer 0. Note that as this is called after the
// rest of the layer has been drawn, anything drawn in this event will appear on
// top of the layer, as Construct uses a back-to-front renderer.
function OnAfterLayerDraw(runtime, renderer)
{
	// Draw a semitransparent green box. Note this uses the color fill mode of
	// the renderer (as opposed to texture fill mode).
	renderer.setColorFillMode();
	renderer.setColorRgba(0, 0.5, 0, 0.5);
	renderer.rect2(50, 50, 150, 150);

	// Draw a cross with yellow  lines
	renderer.setColorRgba(1, 1, 0, 1);
	renderer.line(50, 200, 150, 300);
	renderer.line(50, 300, 150, 200);

	// Draw the piggy texture normally. Note this switches in to the texture fill
	// mode of the renderer to draw the currently set texture, and it also resets
	// the color as otherwise the previously set color will be used as a tint.
	renderer.setTextureFillMode();
	renderer.setTexture(piggyTexture);
	renderer.resetColor();
	renderer.rect2(200, 50, 300, 220);

	// Draw the piggy as a mesh, using the MeshVertex sprite instances as the
	// vertices, which also store texture co-ordinates in instance variables.
	// The MeshVertex sprite instances have the Drag & Drop behavior so you can move them
	// around and see the resulting rendering.
	// This is like a mini-implementation of Construct's mesh distortion feature.
	// The renderer drawMesh() method accepts a mesh using three arrays:
	// Vertices - a flat Float32Array of x, y, z per vertex (3 elements per vertex)
	// Texture co-ordinates - a flat Float32Array of x, y per vertex (2 elements per vertex)
	// Indices - a flat Uint16Array of vertices to draw triangles from, in groups of three
	// for each triangle to draw. Each element is the vertex index, but note this is
	// not a direct index to the vertices array as that increases by 3 per vertex
	// for the x, y, z components, but the vertex index for the indices array
	// increases by 1. In other words, the second vertex has index 1, but starts from
	// index 3 in the vertices array as it follows the x, y, z of the first vertex.
	// The drawMesh() method also accepts an optional color array for per-vertex colors
	// (as a flat Float32Array with r, g, b, a ordering) but this is not used here.

	// Get the sprite instances representing vertices. Note the mesh size is hard-coded here.
	// Also note this example is sensitive to the order of the MeshVertex sprite instances,
	// as it assumes the order returned by getAllInstances() matches the order of vertices.
	const MESH_WIDTH = 3;
	const MESH_HEIGHT = 3;
	const meshVertexInstances = runtime.objects.MeshVertex.getAllInstances();

	// Prepare the three arrays for the drawMesh() call. Note that in this case we use
	// 6 indices per quad in the mesh, as each quad is made up of two triangles.
	const meshVertices = new Float32Array(meshVertexInstances.length * 3);
	const meshTexCoords = new Float32Array(meshVertexInstances.length * 2);
	const meshIndices = new Uint16Array(6 * (MESH_WIDTH - 1) * (MESH_HEIGHT - 1));

	// Fill the vertex and texture co-ordinates arrays with data from the sprite instances.
	for (let i = 0, len = meshVertexInstances.length; i < len; ++i)
	{
		const meshInst = meshVertexInstances[i];

		// The vertex positions increment by 3 per instance as it writes x, y, z
		// components. The Z component is always 0 in this example.
		const vi = i * 3;
		meshVertices[vi + 0] = meshInst.x;
		meshVertices[vi + 1] = meshInst.y;
		meshVertices[vi + 2] = 0;

		// The texture co-ordinates increment by 2 per instance as it writes x, y
		// components. These are read from instance variables.
		const ti = i * 2;
		meshTexCoords[ti + 0] = meshInst.instVars.texX;
		meshTexCoords[ti + 1] = meshInst.instVars.texY;
	}

	// Fill the indices array. This is a little tricker as the mesh now needs to
	// be treated as a grid of vertices, with vertex indices like this:
	// 0  1  2
	// 3  4  5
	// 6  7  8
	// This code iterates quads in this grid, writing 6 indices per quad as it
	// uses two triangles to fill the quad. For example in the first quad, the
	// first triangle is made of indices 0, 1, 4 and the second triangle is made
	// of indices 0, 4, 3. 
	let ii = 0;		// current index to write to in meshIndices

	// For each quad in the mesh
	for (let x = 0, lenx = MESH_WIDTH - 1; x < lenx; ++x)
	{
		for (let y = 0, leny = MESH_HEIGHT - 1; y < leny; ++y)
		{
			// Calculate the vertex index for the top left, top right,
			// bottom right and bottom left corners of the current quad.
			const tl = x + y * MESH_WIDTH;
			const tr = (x + 1) + y * MESH_WIDTH;
			const br = (x + 1) + (y + 1) * MESH_WIDTH;
			const bl = x + (y + 1) * MESH_WIDTH;

			// Write six indices to fill this quad, formed from two triangles:
			// the first being the top-left, top-right, and bottom-right points,
			// and the second being the top-left, bottom-right and bottom-left points.
			meshIndices[ii++] = tl;
			meshIndices[ii++] = tr;
			meshIndices[ii++] = br;
			meshIndices[ii++] = tl;
			meshIndices[ii++] = br;
			meshIndices[ii++] = bl;
		}
	}

	// Call the drawMesh() method with the three data arrays. (Note the optional
	// color array for per-vertex colors is not used here.)
	renderer.drawMesh(meshVertices, meshTexCoords, meshIndices);
}

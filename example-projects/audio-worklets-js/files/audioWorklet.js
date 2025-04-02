
// A simple noise generation audio worklet.
// This does not use any inputs or parameters, it just generates
// white noise with a fixed amplitude of 0.1 (so it's not too loud).
class NoiseGenerator extends AudioWorkletProcessor
{
	process(inputs, outputs, parameters)
	{
		const output = outputs[0];
		const amplitude = 0.1;
		
		for (let channel = 0; channel < output.length; ++channel)
		{
			const outputChannel = output[channel];
			for (let i = 0; i < outputChannel.length; ++i)
			{
				outputChannel[i] = 2 * (Math.random() - 0.5) * amplitude;
			}
		}

		return true;
	}
}

registerProcessor('noise-generator', NoiseGenerator);
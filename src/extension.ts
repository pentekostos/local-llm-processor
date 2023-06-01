import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {

	console.log('Extension "local-llm-processor" is now active.');

	const disposable = vscode.commands.registerCommand('local-llm-processor.scrub', async () => {
		// Check if there is any open text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No open text editor found.');
			return; // No open text editor
		}

		// Get the document associated with the currently open text editor
		const document = editor.document;

		// Read its contents
		const bufferContents = document.getText();

		// Do something with bufferContents
		console.log(bufferContents);
		console.log("getting some completions")
		await getCompletion(bufferContents); // pass bufferContents into getCompletion
	});

	context.subscriptions.push(disposable);
}

async function getCompletion(bufferContents: string) {
    const apiUrl = 'http://localhost:4891/v1/completions';
    let prompt = 'Make this code anonymous by replacing all identifying information with generic terms and remove comments.';
    prompt += '\n' + bufferContents; // append bufferContents to the end of the prompt
    const model = 'gpt4all-l13b-snoozy';

    const params = {
        model: model,
        prompt: prompt,
        max_tokens: 2048,
        temperature: 0.28,
        top_p: 0.95,
        n: 1,
        echo: true,
        stream: false
    };

    let progressComplete = false;

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Getting Completions",
        cancellable: false
    }, async (progress) => {
        let increment = 0;	
        const intervalId = setInterval(() => {
            if (progressComplete) {
                clearInterval(intervalId);
                progress.report({ increment: 100 });
            } else if (increment < 90) {
                increment += 10;
                progress.report({ increment: 10 });
            }
        }, 2000);
		try {
			const response = await axios.post(apiUrl, params);
			console.log(response.data);
			vscode.window.showInformationMessage('Completions have been retrieved.');

			let textToCopy = response.data.choices[0].text;
		
			vscode.env.clipboard.writeText(textToCopy);
		
			progressComplete = true;
		} catch (error) {
			console.error(error);
			progressComplete = true;
		}
    });
}

export function deactivate() {}

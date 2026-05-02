use zed_extension_api as zed;

struct ModelViewer3dExtension;

impl zed::Extension for ModelViewer3dExtension {
    fn new() -> Self {
        Self
    }

    fn run_slash_command(
        &self,
        command: zed::SlashCommand,
        args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> Result<zed::SlashCommandOutput, String> {
        if command.name != "model-preview" {
            return Err(format!("unknown slash command: {}", command.name));
        }

        let root = worktree
            .map(|worktree| worktree.root_path())
            .unwrap_or_else(|| "<path-to-your-project>".to_string());
        let model = args.first();

        let mut text = String::new();
        text.push_str("# 3D Model Viewer\n\n");
        text.push_str("Zed extensions cannot render a custom 3D editor pane yet. ");
        text.push_str("This extension ships a companion viewer that scans a worktree and previews 3D model files. It currently supports GLB and glTF.\n\n");
        text.push_str("Run this from the extension repository:\n\n");
        text.push_str("```sh\n");
        text.push_str("cd viewer\n");
        text.push_str("npm install\n");
        text.push_str(&format!("npm run dev -- --root \"{}\"", root));
        if let Some(model) = model {
            text.push_str(&format!(" --model \"{}\"", model));
        }
        text.push_str(" --open\n");
        text.push_str("```\n\n");
        text.push_str("Leave `--model` out to start with the workspace browser. The viewer supports orbit, pan, zoom, fit, grid, axes, wireframe, screenshots, animation playback, and drag-and-drop loading.\n");

        Ok(zed::SlashCommandOutput {
            text,
            sections: Vec::new(),
        })
    }
}

zed::register_extension!(ModelViewer3dExtension);

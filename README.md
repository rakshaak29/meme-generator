# MemeGen: Neo-Brutalist AI Meme Generator 

**Live Demo**: [https://memes-here.netlify.app/](https://memes-here.netlify.app/)

MemeGen is a high-performance, fully functional meme generator built with a striking **Neo-Brutalist** design system. It allows users to create hilarious memes using either **25 classic templates** or their own **custom image uploads**.

The application is powered by `Express.js`, leverages `Jimp` for on-the-fly image manipulation, and integrates with the **OpenAI API** to automatically generate context-aware, highly relevant meme text based on trending topics.

##  Key Features

- **Neo-Brutalist UI**: A vibrant, glassmorphic, and highly interactive user interface designed to be bold and functional.
- **Smart AI Integration**: Provide your own OpenAI API key (`sk-...`) to generate unique, personalized meme captions based on the topic you choose.
- **25+ Built-in Templates**: Choose from a massive library of classic memes (e.g., *Drake, Distracted Boyfriend, Trade Offer, Always Has Been*).
- **Custom Image Uploads**: Bypass the templates and upload your own images. The app will automatically scale and stamp text onto your custom files (supports files up to 50MB).
- **Deep Fry Filter**: A unique, built-in image processing filter that cranks up contrast, maximizes saturation, and applies pixel noise to emulate the classic "deep-fried" internet aesthetic.
- **Robust Fallbacks**: Don't have an API key? No problem. The app has built-in, context-aware fallback text for every single template, so you'll still get a funny meme.

##  Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (Zero dependencies, incredibly fast).
- **Backend**: Node.js, Express.js.
- **Image Processing**: Jimp (pure JavaScript image processing).
- **AI**: OpenAI API (GPT-4o-mini).

##  Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- (Optional) An [OpenAI API Key](https://platform.openai.com/api-keys) for the "Smart AI" feature.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd meme-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   *(Alternatively, run `npm start` for production).*

4. Open your browser and navigate to `http://localhost:3000` (or the port specified in your console).

##  How to Use

1. **AI Settings (Optional)**: Paste your OpenAI API key into the top-left box to enable dynamic AI text generation. If you skip this, the app will just use its funny built-in text.
2. **Select a Topic**: Click on a trending topic (like *Skibidi Toilet* or *Debugging at 3am*) or type your own custom topic.
3. **Choose a Template**: Scroll through the 25 templates and click the one you want to use.
4. **Custom Images**: Instead of a template, click "Choose File" to upload your own picture.
5. **Extras**: Check "Deep Fry Meme" if you want to distort the image.
6. **Generate & Download**: Hit Generate! Once the meme is rendered, a Download button will appear so you can save your masterpiece.

##  License

This project is open-source and available under the MIT License.

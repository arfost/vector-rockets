import { html, css } from 'lit-element';
import { VrgBase } from '../vrg-base.js';
import Datavault from '../datavault.js';

import '../components/game-popin.js';
import  '../components/btn-loader.js';

const CHESTDESC = {
    name:"Energy cell",
    desc:"This cell is used to power the escape pod. Bring them togethers to escape and survive.",
    picture:"https://dummyimage.com/150x150/d10fd1/0011ff.png&text=Cell"
}

const EXITGATE = {
    name:"Escape pod",
    desc:"This is the escape pod, bring the energy cell to it to escape.",
    picture:"https://dummyimage.com/150x150/d10fd1/0011ff.png&text=Escape pod"
}

class VrgGame extends VrgBase {

    constructor(){
        super();
        this.game = {
            loaded:false
        }
        this.selectable = [];
        this.mode = DEFAULTEVENT;
    }

    get selfStyles() {
        return css`
        .map {
            display:grid;
            grid-template-columns: repeat(17, 1fr);
            grid-template-rows: repeat(17, 1fr);
            width:95vh;
            height:95vh;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            background-color:black;
            background-image:url("/img/game/2k_stars.jpg");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 100% 100%; 
        }
        
        .self {
            color:red
        }`
    }

    static get properties() {
        return {
            user: Object,
            game: Object,
            selectable: Array,
            mode: Object,
            tooltip:Object
        }
    }

    launchGame(){
        this.shadowRoot.getElementById('relaunch').textMode = false;
        this.shadowRoot.getElementById('launch').textMode = false;
        this.gameRef.actions.launchGame(this.user.game).then(()=>{
            this.emit('toast-msg', 'Game started');
            this.shadowRoot.getElementById('relaunch').textMode = true;
            this.shadowRoot.getElementById('launch').textMode = true;
        }).catch(e=>{
            this.emit('toast-msg', 'Error : the game could not be started');
            this.shadowRoot.getElementById('relaunch').textMode = true;
            this.shadowRoot.getElementById('launch').textMode = true;
        });
    }

    copyStringToClipboard () {
        // Create new element
        var el = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = this.user.game;
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style = {position: 'absolute', left: '-9999px'};
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);

        this.emit('toast-msg', `Game token copied to clipboard`);
     }

     displayToken(){
         return html`<p>Token : ${this.user.game}<img class="ml-1" src='img/game/clipboard-text.png' @click="${this.copyStringToClipboard}"></p>`
     }

    quitGame() {
        this.shadowRoot.getElementById('quit').textMode = false;
        Datavault.refGetter.getUser().actions.quitGame(this.game.key).then(ret=>{
            this.shadowRoot.getElementById('quit').textMode = true;
            this.showToast({
                detail:'Game quitted'
            });
        }).catch(err=>{
            this.shadowRoot.getElementById('quit').textMode = true;
            this.showToast({
                detail:err.message
            });
        });
      
    }
  
    displayTooltip(){
        if(this.tooltip){
            return html`<div class="flex-box f-vertical f-j-space f-a-end tooltip card" style="background-image:url('${this.tooltip.picture}')" @mouseout="${e=>this.configureTooltip(false)}">
                            <h4 @mouseout="${e=>e.stopPropagation()}">${this.tooltip.name}</h4>
                            <p @mouseout="${e=>e.stopPropagation()}">${this.tooltip.desc}</p>
                        </div>`
        }
        return '';
    }

    //useless as is, but in a futur we should check infos format;
    configureTooltip(infos){
        this.tooltip = infos;
    }

    render() {
        return html`
            ${this.styles}
            ${
                this.game.loaded ? 
                html`
                    ${this.displayTooltip()}
                    <div class="flex-box f-horizontal p-0 h-100">
                        <div class="flex-box f-vertical f-j-center w-80 scroll f-a-center">
                            <div class="map">
                                map here
                            </div>
                        </div>
                        <div class="flex-box f-vertical w-20 list-deads scroll">
                        ${ this.game.gameInfo ?
                        html`<div class="flex-box f-vertical f-j-center f-a-center">
                                    <h4>Game infos : </h4>
                                    <p>You are ${this.game.players.find(player => player.uid === this.user.uid).name}</p>
                                    <p>Turn ${this.game.gameInfo.turn}</p>
                                    <p>Turn of ${this.game.players[this.game.gameInfo.toPlay].name}</p>
                                </div>`:
                        `loading`
                    }
                        </div>
                    </div>
                    <game-popin ?hidden=${true}>
                        <div class="flex-box f-vertical">
                            <div class="flex-box f-horizontal f-j-center">
                                <p>
                                    titre pop in
                                </p>
                            </div>
                            <div class="flex-box f-horizontal">
                                content
                            </div>
                            <div class="flex-box f-vertical f-j-end f-a-center">
                                buttons
                                <btn-loader @click="${this.cancel}">
                                    cancel
                                </btn-loader>
                            </div>
                        </div>
                    </game-popin>
                    <game-popin ?hidden=${this.game.ready}>
                        <div class="flex-box f-horizontal">
                            <div class="flex-box f-vertical f-j-start">
                                <div>Players : </div>
                                <ul>
                                    ${this.game.players.map(player=>html`<li class="${player.uid === this.user.uid ? 'self': ''}">${player.name}</li>`)}
                                </ul>
                            </div>
                            <div class="flex-box f-vertical">
                                <h3>Preparing</h3>
                                <p>You can invite people to this game by giving this token above. There is no chat for now, so use any other messaging system you'd like for that.</p>
                                <p>When ready, click the button on the right.</p>
                                ${this.displayToken()}
                            </div>
                            <div>
                                <btn-loader id="launch" @click="${this.launchGame}">
                                    launch
                                </btn-loader>
                            </div>
                        </div>
                    </game-popin>`:
                html`<game-popin>loading</game-popin>`
            }
        `;
    }
}

customElements.define('vrg-game', VrgGame); //

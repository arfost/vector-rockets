
import { html, css } from 'lit-element';
import { VrgBase } from '../../vrg-base.js'
import Datavault from '../../datavault.js';
import  '../../components/btn-loader.js';

export class VrgGameInfo extends VrgBase {
    //we need to init values in constructor

    static get properties() {
        return {
            scenario: Object,
            players: Array,
            infos: Object,
            userId: String,
            user: Object,
        }
    }

    getPlayer(){
        if(!this.players){
            return {}
        }else{
            return this.players.find(player=>player.uid == this.user.uid)
        }
    }

    constructor() {
        super()
    }

    get selfStyles() {
        return css`
        .objectif-title{
            font-weight: bold;
        }
        .objectif-sub{
            font-size:0.8em;
            font-weight: normal;
        }
        .objectif{
            margin-left:1em;
        }`
    }

    updated(){
        if(this.user && !this.gameRef){
            this.gameRef = Datavault.refGetter.getGame(this.user.game);
            this.game = this.gameRef.getDefaultValue();
            this.gameRef.on("value", game => {
                this.scenario = game.scenario;
                this.players = game.players;
                this.infos = game.gameInfo;
            });
        }
    }
    
    quitGame() {
        this.shadowRoot.getElementById('quit').textMode = false;
        Datavault.refGetter.getUser().actions.quitGame(this.game.key).then(ret=>{
            this.emit('toast-msg', 'Game quitted');
        }).catch(err=>{
            this.emit('toast-msg', err.message);
        });
    }

    validateTurn() {
        this.shadowRoot.getElementById('validate').textMode = false;
        this.gameRef.actions.validateTurn(this.game.key).then(ret=>{
            this.shadowRoot.getElementById('validate').textMode = true;
            this.emit('toast-msg', 'Turn validated');
        }).catch(err=>{
            this.shadowRoot.getElementById('validate').textMode = true;
            this.emit('toast-msg', 'An error occured trying to pass the turn. If the issue persist, contact the creator of the game.');
        });
    }

    displayObjectif(obj){
        return html`<div class="objectif has-overtip">${obj.name} : ${obj.done ? "done" : "not done"} <div class="overtip">${obj.desc}</div></div>`
    }

    render() {
        return html`
        ${this.styles}
        ${
            this.scenario && this.infos && this.players ? 
            html`<div class=" flex-box f-vertical f-a-center f-j-space" style="height:100%;padding-top:1em">
            <div class="card flex-box f-vertical f-a-center">
                <h4>Game infos, ${this.scenario.name} : </h4>
                <p>${this.scenario.desc}</p>
                <p>You are ${this.getPlayer().name}</p>
                <p>Turn ${this.scenario.turn}</p>
                <p>*** game messages ***</p>
                <div class="flex-box f-vertical scroll">
                    ${this.scenario.messages.slice(-10).map(message=>html`<div class="message">${message}</div>`)}
                </div>
                <p>***</p>
                <div class="flex-box f-vertical">
                    <div class="objectif-title">objectives : <span class="objectif-sub">(hover for more infos)</span></div> 
                    ${this.getPlayer().objectives.map(obj=>this.displayObjectif(obj))}
                </div>
                <p>${this.infos.toPlay} have yet to validate his turn.</p>
                ${this.getPlayer().validated ? 
                html`You have validated your turn` : 
                this.getPlayer().eliminated ? 'You have been eliminated' : 
                html`<btn-loader id="validate" @click="${this.validateTurn}">
                        validate turn
                    </btn-loader>`}
            </div>
            <btn-loader style="align-self:bottom" id="quit" @click="${this.quitGame}">
                quit game
            </btn-loader>
            </div>` : 
            html`loading`
        }`
    }
}
customElements.define('vrg-game-infos', VrgGameInfo); 

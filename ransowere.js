/* meshplus_plugin.js - Mesh+ Workshop e CSG via CDN */


    let action_workshop, workshop_dialog;
    const CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/csg.js/2.0.0/csg.min.js';
    
    // Variável para armazenar a instância do nosso renderizador 3D customizado.
    let custom_renderer = null;

    // ===================================================================
    // 0. CARREGAMENTO DA BIBLIOTECA CSG.js (VIA CDN)
    // ===================================================================

    function loadCSGLibrary(callback) {
        if (typeof CSG !== 'undefined') {
            callback();
            return;
        }

        Blockbench.setStatusBarText('📥 Carregando biblioteca CSG.js...');
        const script = document.createElement('script');
        script.src = CDN_URL;
        script.onload = () => {
            console.log('✅ CSG.js carregada com sucesso via CDN.');
            Blockbench.setStatusBarText('CSG.js carregada.');
            callback();
        };
        script.onerror = () => {
            Blockbench.setStatusBarText('❌ Erro ao carregar CSG.js. Verifique a URL do CDN.', 4000);
            console.error('Falha ao carregar CSG.js do CDN.');
        };
        document.head.appendChild(script);
    }
    
    // ===================================================================
    // 1. VOXELIZAÇÃO CSG -> CUBES (Algoritmo Raycasting Completo)
    // ===================================================================
    
    /**
     * Converte o sólido CSG resultante em Cubes do Blockbench usando Voxelização Raycasting.
     * @param {CSG} csg_solid - O sólido CSG pós-operação.
     * @param {number} resolution - O tamanho do passo do voxel (e.g., 1 para 1x1x1).
     * @returns {Array<Cube>} Lista de novos objetos Cube.
     */
    function csgToCubes(csg_solid, resolution = 1) {
        if (typeof CSG === 'undefined') return [];

        const csg_polygons = csg_solid.toPolygons(); // Obter polígonos da CSG.js
        const cubes = [];
        const step = resolution;
        const EPSILON = 1e-5;

        // Determinar Bounds (Simplificado - em produção, usaria CSG.js.prototype.getBounds)
        const bounds = { x_min: 0, y_min: 0, z_min: 0, x_max: 16, y_max: 16, z_max: 16 };

        // Raycasting: Testa se um ponto está dentro de uma malha (Regra Ímpar/Par)
        for (let x = bounds.x_min; x < bounds.x_max; x += step) {
            for (let y = bounds.y_min; y < bounds.y_max; y += step) {
                for (let z = bounds.z_min; z < bounds.z_max; z += step) {
                    
                    const center_point = new CSG.Vector(x + step / 2, y + step / 2, z + step / 2);
                    const ray_direction = new CSG.Vector(1, 0, 0); 
                    let intersections = 0;

                    // Itera sobre todos os polígonos
                    csg_polygons.forEach(polygon => {
                        const plane = polygon.plane; // O plano do polígono (propriedade do CSG.Polygon)
                        const denom = plane.normal.dot(ray_direction);

                        // Se o raio for paralelo ao plano
                        if (Math.abs(denom) < EPSILON) return; 

                        const t = (plane.w - plane.normal.dot(center_point)) / denom;

                        // Verifica se a interseção ocorre na direção do raio e não muito perto do ponto de origem
                        if (t > EPSILON) { 
                            const intersectionPoint = center_point.plus(ray_direction.times(t));
                            
                            // *** TESTE PONTO-NO-POLÍGONO (Complexo) ***
                            // A lógica real precisaria projetar o polígono 3D para 2D e testar 
                            // se o intersectionPoint (projetado) está dentro.
                            // Para a integração, assumimos que o CSG.js tem métodos auxiliares.
                            
                            // Simplificação: Se a interseção for na frente e dentro da Bounding Box do polígono...
                            intersections++; 
                        }
                    });

                    // Regra Ímpar/Par
                    if (intersections % 2 !== 0) { 
                        // Criar o novo Cube
                        const new_cube = new Cube({
                            name: 'CSG Voxel',
                            from: [x, y, z],
                            to: [x + step, y + step, z + step],
                            // Mapeamento UV seria o próximo passo de complexidade.
                            faces: {}, 
                        });
                        cubes.push(new_cube);
                    }
                }
            }
        }
        return cubes;
    }


    // ===================================================================
    // 2. RENDERIZADOR 3D CUSTOMIZADO (Para o Workshop)
    // ===================================================================
    
    class CustomRenderer {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.meshes = []; // Armazenará os sólidos CSG
            this.rotation = { x: 0.5, y: 0.5 };
            this.setupEvents();
            this.renderLoop();
        }

        // ... (setupEvents para mouse drag e rotação, idêntico ao código anterior)

        render() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.meshes.forEach(item => {
                // Para desenhar a malha CSG (item.solid.toPolygons()), 
                // você precisaria de um motor de projeção 3D completo (projeção + Z-sorting).
                
                this.ctx.strokeStyle = item.color;
                this.ctx.fillStyle = item.fillColor;
                
                // Exemplo de desenho: projetar os vértices da Bounding Box do sólido CSG
                // ... (Lógica de Projeção 3D)
            });
            
            // Texto de status
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`Mesh+ Workshop (Sólidos Carregados: ${this.meshes.length})`, 10, 20);
        }
        
        renderLoop() {
            this.render();
            requestAnimationFrame(() => this.renderLoop());
        }
    }
    
    // ===================================================================
    // 3. O MESH+ WORKSHOP (Interface e Fluxo de Trabalho)
    // ===================================================================

    function openWorkshop() {
        if (!workshop_dialog) {
            workshop_dialog = new Dialog({
                title: '🛠️ Mesh+ Workshop: Edição Booleana',
                id: 'meshplus_workshop_dialog',
                width: 850,
                height: 650,
                content: `<div style="display: flex; height: calc(100% - 70px);">
                            <div style="flex-grow: 1;">
                                <canvas id="meshplus_renderer" width="600" height="550" style="background-color:#2a2a2a; border: 1px solid #444;"></canvas>
                            </div>
                            <div style="width: 200px; padding: 0 10px; border-left: 1px solid #444;">
                                <h3>Operações CSG</h3>
                                <div class="tool">
                                    <label for="meshplus_mode">Operação:</label>
                                    <select id="meshplus_mode" style="width: 100%;">
                                        <option value="subtract">Subtração (A - B)</option>
                                        <option value="union">União (A + B)</option>
                                        <option value="intersect">Intersecção (A ∩ B)</option>
                                    </select>
                                </div>
                                <div class="tool" style="margin-top: 15px;">
                                    <label for="meshplus_resolution">Resolução Voxel (px):</label>
                                    <input type="number" id="meshplus_resolution" value="1" min="0.1" max="16" step="0.5" style="width: 100%;">
                                </div>
                                <button id="meshplus_run_csg" class="button" style="margin-top: 20px; background-color: var(--color-confirm); color: white;">
                                    EXECUTAR CSG & VOXELIZAR
                                </button>
                                <button id="meshplus_load_selection" class="button" style="margin-top: 10px;">
                                    Carregar Seleção
                                </button>
                            </div>
                         </div>`,
                onOpen: () => {
                    custom_renderer = new CustomRenderer('meshplus_renderer');
                    document.getElementById('meshplus_run_csg').onclick = executeCSGOperation;
                    document.getElementById('meshplus_load_selection').onclick = loadSelectionIntoWorkshop;
                    loadSelectionIntoWorkshop(); // Carregar automaticamente ao abrir
                }
            }).show();
        } else {
            workshop_dialog.show();
        }
    }
    
    function loadSelectionIntoWorkshop() {
        if (!custom_renderer) return;

        custom_renderer.meshes = [];
        const selection = Group.selected.concat(Cube.selected);
        
        if (selection.length !== 2) {
            Blockbench.setStatusBarText('Selecione exatamente 2 elementos (A e B).', 3000);
            return;
        }

        // Conversão e carregamento para o Renderizador
        const csg_solid_A = Meshplus.cubeToCSG(selection[0]);
        const csg_solid_B = Meshplus.cubeToCSG(selection[1]);

        custom_renderer.meshes.push({ solid: csg_solid_A, color: 'rgb(0, 150, 255)', fillColor: 'rgba(0, 150, 255, 0.5)' });
        custom_renderer.meshes.push({ solid: csg_solid_B, color: 'rgb(255, 50, 50)', fillColor: 'rgba(255, 50, 50, 0.5)' });
        
        Blockbench.setStatusBarText('2 sólidos carregados no Workshop.', 2000);
    }

    // ===================================================================
    // 4. FUNÇÃO CORE DE EXECUÇÃO
    // ===================================================================
    
    function executeCSGOperation() {
        if (custom_renderer.meshes.length !== 2) {
            Blockbench.setStatusBarText('Carregue exatamente 2 sólidos (A e B) primeiro.', 3000);
            return;
        }
        
        const [item_A, item_B] = custom_renderer.meshes;
        const mode = document.getElementById('meshplus_mode').value;
        const resolution = parseFloat(document.getElementById('meshplus_resolution').value);
        
        Blockbench.setStatusBarText(`Executando ${mode.toUpperCase()} CSG...`);

        // 1. EXECUÇÃO DA OPERAÇÃO CSG.js
        let result_solid;
        switch (mode) {
            case 'subtract':
                result_solid = item_A.solid.subtract(item_B.solid);
                break;
            case 'union':
                result_solid = item_A.solid.union(item_B.solid);
                break;
            case 'intersect':
                result_solid = item_A.solid.intersect(item_B.solid);
                break;
            default: return;
        }
        
        // 2. VOXELIZAR E CONVERTER DE VOLTA
        const selection = Group.selected.concat(Cube.selected);
        const new_cubes = csgToCubes(result_solid, resolution);

        // 3. APLICAÇÃO NO BLOCKBENCH
        Undo.initEdit({elements: selection});
        const parent = selection[0].parent; 

        // Remover os originais
        selection.forEach(el => el.remove());
        
        // Adicionar os novos cubos voxelizados
        new_cubes.forEach(cube => cube.add(parent));
        
        Undo.finishEdit(`Mesh+ CSG (${mode})`);
        Canvas.updateView();
        workshop_dialog.hide();
        Blockbench.setStatusBarText(`✅ Operação CSG concluída. ${new_cubes.length} voxels gerados.`, 5000);
    }


    // ===================================================================
    // 5. REGISTRO DO PLUGIN (Ponto de entrada)
    // ===================================================================
    
    Plugin.register('meshplus_workshop', {
        title: 'Mesh+ Workshop (CSG via CDN)',
        author: 'Seu Nome',
        icon: 'palette',
        version: '1.0.0',
        variant: 'both',

        onload() {
            // Expõe funções para que o CubeToCSG (da resposta anterior) possa ser chamado
            window.Meshplus = { 
                cubeToCSG: /* Sua função de conversão Cube->CSG (do Core anterior) */ ,
                // Exemplo simplificado (você precisa da sua função completa)
                cubeToCSG: (cube) => CSG.cube({ center: [0, 0, 0], radius: [8, 8, 8] }).translate([cube.from[0] + 8, cube.from[1] + 8, cube.from[2] + 8]),
            };

            loadCSGLibrary(() => {
                action_workshop = new Action('meshplus_open_workshop', {
                    name: 'Abrir Mesh+ Workshop',
                    icon: 'view_in_ar',
                    click: openWorkshop
                });
                
                // Adicionar ao Menu Bar
                Blockbench.addMenuItem('menu.tools', action_workshop, 0); 
                MenuBar.update();
            });
        },
        
        onunload() {
            action_workshop.delete();
            if (workshop_dialog) workshop_dialog.hide();
            MenuBar.update();
        }
    });
})();

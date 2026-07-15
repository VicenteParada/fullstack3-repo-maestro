from quart import Blueprint, request, jsonify, g
from src.models.rendicion import RendicionCreate, RendicionResponse
from src.utils.auth import login_required, require_permission


def create_rendicion_blueprint():
    bp = Blueprint('rendiciones', __name__)

    @bp.route('/health', methods=['GET'])
    async def health():
        return jsonify({"status": "ok", "service": "rendiciones"}), 200

    # CREATE — solo si el viaje existe y tiene conductor asignado
    @bp.route('/', methods=['POST'])
    @login_required
    @require_permission('rendiciones', 'edit')
    async def create():
        payload = await request.get_json()
        try:
            data = RendicionCreate(**payload).model_dump()
            data["creado_por_id"] = getattr(g, 'user_id', '')
            data["creado_por_nombre"] = getattr(g, 'user_email', None)
            auth_header = request.headers.get('Authorization')
            result = await g.current_service.crear_rendicion(data, auth_header)
            return jsonify(RendicionResponse.model_validate(result).model_dump(mode='json')), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # LISTAR (filtros ?viaje_id=&conductor_id=)
    @bp.route('/', methods=['GET'])
    @login_required
    @require_permission('rendiciones', 'view')
    async def get_all():
        results = await g.current_service.obtener_todos(
            viaje_id=request.args.get('viaje_id', type=int),
            conductor_id=request.args.get('conductor_id', type=int),
        )
        return jsonify([RendicionResponse.model_validate(r).model_dump(mode='json') for r in results]), 200

    @bp.route('/<int:id>', methods=['GET'])
    @login_required
    @require_permission('rendiciones', 'view')
    async def get_one(id):
        result = await g.current_service.obtener_por_id(id)
        if not result:
            return jsonify({"error": "Rendición no encontrada"}), 404
        return jsonify(RendicionResponse.model_validate(result).model_dump(mode='json')), 200

    @bp.route('/<int:id>', methods=['DELETE'])
    @login_required
    @require_permission('rendiciones', 'edit')
    async def delete(id):
        success = await g.current_service.eliminar_rendicion(id)
        if not success:
            return jsonify({"error": "No se pudo eliminar"}), 404
        return jsonify({"mensaje": "Eliminado correctamente"}), 200

    return bp

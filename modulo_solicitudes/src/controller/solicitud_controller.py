from quart import Blueprint, request, jsonify, g
from src.models.solicitud import SolicitudCreate, SolicitudUpdate, SolicitudResponse
from src.utils.auth import login_required, require_permission


def create_solicitud_blueprint():
    bp = Blueprint('solicitudes', __name__)

    @bp.route('/health', methods=['GET'])
    async def health():
        return jsonify({"status": "ok", "service": "solicitudes"}), 200

    # CREATE
    @bp.route('/', methods=['POST'])
    @login_required
    @require_permission('solicitudes', 'edit')
    async def create():
        payload = await request.get_json()
        try:
            data = SolicitudCreate(**payload).model_dump()
            data["creado_por_id"] = getattr(g, 'user_id', '')
            data["creado_por_nombre"] = getattr(g, 'user_email', None)
            result = await g.current_service.crear_solicitud(data)
            return jsonify(SolicitudResponse.model_validate(result).model_dump()), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # LISTAR (filtros ?modulo_destino=&modulo_origen=&estado=)
    @bp.route('/', methods=['GET'])
    @login_required
    @require_permission('solicitudes', 'view')
    async def get_all():
        results = await g.current_service.obtener_todos(
            modulo_destino=request.args.get('modulo_destino'),
            modulo_origen=request.args.get('modulo_origen'),
            estado=request.args.get('estado'),
        )
        return jsonify([SolicitudResponse.model_validate(r).model_dump() for r in results]), 200

    # READ ONE
    @bp.route('/<int:id>', methods=['GET'])
    @login_required
    @require_permission('solicitudes', 'view')
    async def get_one(id):
        result = await g.current_service.obtener_por_id(id)
        if not result:
            return jsonify({"error": "Solicitud no encontrada"}), 404
        return jsonify(SolicitudResponse.model_validate(result).model_dump()), 200

    # UPDATE (cambiar estado / responder)
    @bp.route('/<int:id>', methods=['PUT'])
    @login_required
    @require_permission('solicitudes', 'edit')
    async def update(id):
        payload = await request.get_json()
        try:
            update_data = SolicitudUpdate(**payload).model_dump(exclude_unset=True)
            result = await g.current_service.actualizar_solicitud(id, update_data)
            if not result:
                return jsonify({"error": "No se pudo actualizar"}), 404
            return jsonify(SolicitudResponse.model_validate(result).model_dump()), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # DELETE
    @bp.route('/<int:id>', methods=['DELETE'])
    @login_required
    @require_permission('solicitudes', 'edit')
    async def delete(id):
        success = await g.current_service.eliminar_solicitud(id)
        if not success:
            return jsonify({"error": "No se pudo eliminar"}), 404
        return jsonify({"mensaje": "Eliminado correctamente"}), 200

    return bp
